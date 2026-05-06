import os
import io
import base64
import tempfile
import numpy as np
import mne
import torch
import torch.nn as nn
import torchaudio
import matplotlib.pyplot as plt
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Allow cross-origin requests from the web frontend

# Model Definition (Must match train.ipynb)
class CNN_LSTM_Model(nn.Module):
    def __init__(self, num_channels, num_classes=2):
        super(CNN_LSTM_Model, self).__init__()
        self.cnn = nn.Sequential(
            nn.Conv2d(num_channels, 16, kernel_size=3, padding=1),
            nn.BatchNorm2d(16),
            nn.ReLU(),
            nn.MaxPool2d(2),
            nn.Conv2d(16, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(),
            nn.MaxPool2d(2)
        )
        self.adaptive_pool = nn.AdaptiveAvgPool2d((1, None))
        self.lstm = nn.LSTM(input_size=32, hidden_size=64, num_layers=2, batch_first=True, dropout=0.3)
        self.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(64, num_classes)
        )

    def forward(self, x):
        x = self.cnn(x)
        x = self.adaptive_pool(x)
        x = x.squeeze(2)
        x = x.permute(0, 2, 1)
        lstm_out, _ = self.lstm(x)
        out = lstm_out[:, -1, :]
        out = self.fc(out)
        return out

DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = CNN_LSTM_Model(num_channels=19).to(DEVICE)
try:
    # Use map_location to allow running on CPU even if trained on GPU
    model.load_state_dict(torch.load('model_weights.pth', map_location=DEVICE))
    model.eval()
    print("Model loaded successfully.")
except Exception as e:
    print(f"Error loading model: {e}")

def process_and_predict(file_path):
    # 1. Read EDF
    raw = mne.io.read_raw_edf(file_path, preload=True, verbose=False)
    
    # 2. Drop irrelevant channels
    channels_to_drop = [ch for ch in raw.ch_names if 'stim' in ch.lower() or 'anno' in ch.lower() or 'event' in ch.lower()]
    if channels_to_drop:
        raw.drop_channels(channels_to_drop)
        
    # 3. Resample to 128Hz
    raw.resample(128)
    data = raw.get_data()
    
    # Take first 19 channels
    if data.shape[0] >= 19:
        data = data[:19, :]
    else:
        raise ValueError(f"Not enough channels in the EDF file (has {data.shape[0]}, needs at least 19)")
        
    # 4. Standardize
    mean = np.mean(data, axis=1, keepdims=True)
    std = np.std(data, axis=1, keepdims=True)
    data = (data - mean) / (std + 1e-8)
    
    # 5. Sliding window (5 seconds epochs)
    samples_per_epoch = int(5.0 * 128)
    stride_samples = int(5.0 * 128) # No overlap
    
    epochs = []
    for start in range(0, data.shape[1] - samples_per_epoch + 1, stride_samples):
        epochs.append(data[:, start:start+samples_per_epoch])
        
    if len(epochs) == 0:
        raise ValueError("The EDF file is too short. Need at least 5 seconds of data.")
        
    epochs_tensor = torch.tensor(np.array(epochs), dtype=torch.float32) # Shape: (N, 19, 640)
    
    # 6. Apply STFT
    stft = torchaudio.transforms.Spectrogram(n_fft=128, hop_length=32, power=2.0)
    spec = torch.log1p(stft(epochs_tensor)) # Shape: (N, 19, Freq, Time)
    
    # 7. Generate STFT image of the first channel from the FIRST epoch for visualization
    plt.figure(figsize=(10, 4))
    plt.imshow(spec[0, 0].numpy(), aspect='auto', origin='lower', cmap='viridis')
    plt.title(f'STFT Spectrogram (Channel 1 - Epoch 1 of {len(epochs)})')
    plt.xlabel('Time Frames')
    plt.ylabel('Frequency Bins')
    plt.colorbar(format='%+2.0f dB')
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', bbox_inches='tight')
    plt.close()
    buf.seek(0)
    img_base64 = base64.b64encode(buf.read()).decode('utf-8')
    
    # 8. Model Prediction (Batch process all epochs)
    input_tensor = spec.to(DEVICE) # Shape: (N, 19, Freq, Time)
    with torch.no_grad():
        outputs = model(input_tensor)
        probabilities = torch.softmax(outputs, dim=1)
        
    # Average probabilities across all epochs
    avg_probabilities = probabilities.mean(dim=0)
    prob_mdd = avg_probabilities[1].item()
        
    prediction = "MDD" if prob_mdd > 0.5 else "Healthy"
    
    return prediction, prob_mdd, img_base64

@app.route('/api/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
        
    if file and file.filename.endswith('.edf'):
        filepath = os.path.join(tempfile.gettempdir(), file.filename)
        file.save(filepath)
        try:
            prediction, probability, img_base64 = process_and_predict(filepath)
            os.remove(filepath)
            return jsonify({
                'prediction': prediction,
                'probability_mdd': float(probability),
                'probability_mdd_percent': f"{probability * 100:.2f}%",
                'stft_image_base64': f"data:image/png;base64,{img_base64}"
            })
        except Exception as e:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': str(e)}), 500
    else:
        return jsonify({'error': 'Invalid file format. Please upload an .edf file.'}), 400

if __name__ == '__main__':
    print("Starting AI Model Server on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=False)
