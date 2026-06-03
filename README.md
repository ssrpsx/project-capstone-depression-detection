# JID — EEG-Based Depression Analysis System

EEG-Based Depression Analysis System Using CNN-LSTM and AI Companion Chatbot

JID analyzes EEG brainwave recordings to screen for Major Depressive Disorder (MDD) using a CNN-LSTM deep learning model trained on the Mumtaz et al. (2017) dataset, achieving **98.81% test accuracy**. The system also provides an AI Companion Chatbot powered by Typhoon LLM for emotional support in Thai.

This project is submitted as part of the **CAPSTONE PROJECT** course, Faculty of Science, Applied Computer Science Program, King Mongkut's University of Technology Thonburi (KMUTT), Academic Year 2026.

> **Disclaimer:** This system is a preliminary screening tool only. It cannot replace a licensed psychiatrist or serve as a clinical diagnosis.

## EEG Prediction Features

- Upload standard `.edf` EEG recordings (19-channel, any sample rate)
- Signal preprocessed via STFT — resampled to 128 Hz, segmented into 5-second epochs
- CNN-LSTM model returns MDD probability with Low / Moderate / High risk classification
- Epoch-by-epoch risk bar charts and EEG frequency band power visualization

## AI Companion Chatbot Features

- Thai-language AI companion powered by Typhoon LLM
- Empathetic conversation designed for emotional support and stress relief
- Clearly scoped as a companion — not a clinical diagnosis or psychological counseling tool

## User Account Features

- Register and login with JWT authentication
- Dark mode that persists across all pages via localStorage
- Profile management — name, email, phone, profile picture
- Prediction history and chat history saved per user
- Help & FAQ with 20 common questions about depression

## Model Performance

| | |
|---|---|
| Architecture | STFT → CNN-LSTM (PyTorch) |
| Dataset | Mumtaz et al. (2017) — 43 subjects (29 MDD / 14 Healthy) |
| Split | Subject-wise 80 / 20 (no data leakage) |
| Test Accuracy | **98.81%** |
| Train Accuracy | 99.60% |
| Loss (Epoch 20) | 0.0135 |
| Optimizer | Adam · lr 0.001 · Batch Size 32 · 20 Epochs |

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js · Express.js · JWT · Multer · MySQL (mysql2)
- **AI / ML API**: Python · Flask · PyTorch · MNE-Python · Torchaudio (STFT)
- **Chatbot**: Typhoon LLM API
- **Database**: MySQL

## Option A — Docker (Recommended)

Requires [Docker Desktop](https://www.docker.com/products/docker-desktop/).

### 1. Clone this repository

```bash
git clone https://github.com/ssrpsx/capstone-depression-detection.git
cd capstone-depression-detection
```

### 2. Configure environment

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and fill in the two required secrets:

```env
JWT_SECRET=your_secret_key
TYPHOON_API_KEY=your_typhoon_api_key
```

> DB_HOST, DB_USER, DB_PASSWORD, and DB_NAME are pre-configured for Docker — no changes needed.

### 3. Build and start all services

```bash
docker compose up --build
```

Wait until the terminal shows all four services ready (db, backend, ai, frontend).

### 4. Open the app

Open **http://localhost:8080** in your browser.

To stop: `docker compose down`

---

## Option B — Manual Setup

### 1. Clone this repository

```bash
git clone https://github.com/ssrpsx/capstone-depression-detection.git
cd capstone-depression-detection
```

### 2. Set up the database

Create a MySQL database and configure `backend/.env`:

```bash
cd backend
cp .env.example .env
```

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=my_project_db
JWT_SECRET=your_secret_key
TYPHOON_API_KEY=your_typhoon_api_key
```

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Start the backend server

```bash
node server.js
```

```
Server running on http://localhost:3000
```

### 5. Install Python AI dependencies

```bash
pip install flask mne torch torchaudio scipy numpy
```

### 6. Start the AI server

```bash
python app.py
```

```
AI API running on http://localhost:5000
```

### 7. Open the frontend

Open `frontend/landing.html` in your browser.

---

**Authors** — Chanathip Choochuay · Sarawut Ponsan · Chanya Rodsamer

**Advisor** — Asst. Prof. Dr. Thitaporn Ganokroj

Faculty of Science, Applied Computer Science, KMUTT · 2026
