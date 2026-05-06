/* ══════════════════════════════════════════════
   predict.js  –  JID Prediction Page
   ══════════════════════════════════════════════ */

const token  = localStorage.getItem('jwt_token');
const userId = localStorage.getItem('user_id');

// ─── Auth Guard ─────────────────────────────
if (!token || !userId) {
    window.location.href = 'index.html';
}

// ─── Logout ─────────────────────────────────
const btnLogout = document.getElementById('nav-logout');
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.clear();
        window.location.href = 'index.html';
    });
}

// ─── DOM Refs ────────────────────────────────
const dropZone       = document.getElementById('drop-zone');
const fileInput      = document.getElementById('file-input');
const btnBrowse      = document.getElementById('btn-browse');
const btnRemove      = document.getElementById('btn-remove');
const btnAnalyze     = document.getElementById('btn-analyze');
const btnReset       = document.getElementById('btn-reset');
const btnSave        = document.getElementById('btn-save');

const dropInner      = document.getElementById('drop-zone-inner');
const fileSelected   = document.getElementById('file-selected');
const fileNameEl     = document.getElementById('file-name');
const fileSizeEl     = document.getElementById('file-size');

const uploadCard     = document.getElementById('upload-card');
const analyzingCard  = document.getElementById('analyzing-card');
const resultCard     = document.getElementById('result-card');

const progressFill   = document.getElementById('progress-fill');
const progressPct    = document.getElementById('progress-pct');

const gaugeArc       = document.getElementById('gauge-arc');
const gaugePct       = document.getElementById('gauge-pct');
const verdictBadge   = document.getElementById('verdict-badge');
const verdictIcon    = document.getElementById('verdict-icon');
const verdictText    = document.getElementById('verdict-text');
const verdictDesc    = document.getElementById('verdict-desc');
const resultFilename = document.getElementById('result-filename');
const resultLevel    = document.getElementById('result-level');
const resultDate     = document.getElementById('result-date');
const stftContainer  = document.getElementById('stft-container');
const stftImage      = document.getElementById('stft-image');

let selectedFile = null;

// ─── Helpers ─────────────────────────────────
function formatBytes(bytes) {
    if (bytes < 1024)       return bytes + ' B';
    if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function showFile(file) {
    selectedFile = file;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatBytes(file.size);
    dropInner.style.display  = 'none';
    fileSelected.style.display = 'flex';
    btnAnalyze.disabled = false;
}

function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    dropInner.style.display = 'flex';
    fileSelected.style.display = 'none';
    btnAnalyze.disabled = true;
}

// ─── File Input ──────────────────────────────
btnBrowse.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
    if (fileInput.files[0]) showFile(fileInput.files[0]);
});

// ─── Drag & Drop ─────────────────────────────
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('dragover');
});

dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) showFile(file);
});

// ─── Remove File ─────────────────────────────
btnRemove.addEventListener('click', clearFile);

// ─── Analyze ─────────────────────────────────
btnAnalyze.addEventListener('click', startAnalysis);

async function startAnalysis() {
    if (!selectedFile) return;

    // Show analyzing card
    uploadCard.style.display    = 'none';
    analyzingCard.style.display = '';
    resultCard.style.display    = 'none';

    // Fake progress animation
    let pct = 0;
    const interval = setInterval(() => {
        pct += Math.random() * 8 + 2;
        if (pct >= 95) { pct = 95; clearInterval(interval); }
        progressFill.style.width = pct + '%';
        progressPct.textContent  = Math.round(pct) + '%';
    }, 200);

    try {
        // Build form data
        const formData = new FormData();
        formData.append('file', selectedFile);

        // Fetch to Python AI API
        const res = await fetch('http://localhost:5000/api/predict', {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) {
            let errorMsg = 'API Error';
            try {
                const errData = await res.json();
                errorMsg = errData.error || errorMsg;
            } catch (e) {}
            throw new Error(errorMsg);
        }
        
        const data = await res.json();

        clearInterval(interval);
        progressFill.style.width = '100%';
        progressPct.textContent  = '100%';

        await new Promise(r => setTimeout(r, 400));
        showResult(data.probability_mdd, selectedFile.name, data.stft_image_base64);

    } catch (err) {
        clearInterval(interval);
        console.error('Prediction error:', err);
        alert('เกิดข้อผิดพลาดในการวิเคราะห์ข้อมูล กรุณาลองใหม่อีกครั้ง');
        resetView();
    }
}

// ─── Show Result ─────────────────────────────
function showResult(probability, filename, stftImageBase64) {
    analyzingCard.style.display = 'none';
    resultCard.style.display    = '';

    const pct = Math.round(probability * 100);

    // Animate gauge (SVG arc — full arc length ≈ 251.2)
    const arcLength = 251.2;
    const offset    = arcLength - (arcLength * probability);

    gaugeArc.style.strokeDashoffset = arcLength; // start hidden
    gaugePct.textContent = '0%';

    setTimeout(() => {
        gaugeArc.style.strokeDashoffset = offset;
        // Count-up animation
        let current = 0;
        const step  = pct / 60;
        const timer = setInterval(() => {
            current += step;
            if (current >= pct) { current = pct; clearInterval(timer); }
            gaugePct.textContent = Math.round(current) + '%';
        }, 16);
    }, 100);

    // Color gauge by risk level
    if (pct >= 70) {
        gaugeArc.style.stroke = '#e05555';
    } else if (pct >= 40) {
        gaugeArc.style.stroke = '#e08800';
    } else {
        gaugeArc.style.stroke = '#1a8f5c';
    }

    // Verdict
    verdictBadge.className = 'verdict-badge';
    if (pct >= 70) {
        verdictBadge.classList.add('risk');
        verdictIcon.className = 'fa-solid fa-triangle-exclamation verdict-icon';
        verdictText.textContent = 'มีความเสี่ยงสูง';
        verdictDesc.textContent =
            'ผลการวิเคราะห์ชี้ว่าอาจมีภาวะซึมเศร้าในระดับที่ควรได้รับการดูแล ' +
            'ควรพบแพทย์หรือนักจิตวิทยาเพื่อรับการประเมินอย่างเป็นทางการ';
        resultLevel.textContent = 'สูง (High Risk)';
    } else if (pct >= 40) {
        verdictBadge.classList.add('moderate');
        verdictIcon.className = 'fa-solid fa-circle-exclamation verdict-icon';
        verdictText.textContent = 'มีความเสี่ยงปานกลาง';
        verdictDesc.textContent =
            'พบสัญญาณบางอย่างที่ควรระวัง แนะนำให้ดูแลสุขภาพจิตอย่างใกล้ชิด ' +
            'และติดตามอาการอย่างต่อเนื่อง';
        resultLevel.textContent = 'ปานกลาง (Moderate)';
    } else {
        verdictBadge.classList.add('safe');
        verdictIcon.className = 'fa-solid fa-circle-check verdict-icon';
        verdictText.textContent = 'ไม่พบภาวะซึมเศร้า';
        verdictDesc.textContent =
            'ผลการวิเคราะห์ไม่พบสัญญาณของภาวะซึมเศร้า อย่างไรก็ตามผลนี้เป็น ' +
            'เพียงการประเมินเบื้องต้น ไม่ใช่การวินิจฉัยทางการแพทย์';
        resultLevel.textContent = 'ต่ำ (Low Risk)';
    }

    // Detail info
    resultFilename.textContent = filename;
    resultDate.textContent     = new Date().toLocaleDateString('th-TH', {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    // STFT Image
    if (stftImageBase64) {
        stftImage.src = stftImageBase64;
        stftContainer.style.display = 'block';
    } else {
        stftContainer.style.display = 'none';
    }
}

// ─── Reset ───────────────────────────────────
function resetView() {
    clearFile();
    analyzingCard.style.display = 'none';
    resultCard.style.display    = 'none';
    uploadCard.style.display    = '';
    progressFill.style.width    = '0%';
    progressPct.textContent     = '0%';
    stftContainer.style.display = 'none';
    stftImage.src               = '';
}

btnReset.addEventListener('click', resetView);

// ─── Save Result ─────────────────────────────
btnSave.addEventListener('click', () => {
    const pct  = gaugePct.textContent;
    const msg  = verdictText.textContent;
    const date = resultDate.textContent;
    const blob = new Blob(
        [`JID Prediction Report\n\nไฟล์: ${resultFilename.textContent}\nความน่าจะเป็น: ${pct}\nผล: ${msg}\nวันที่: ${date}\n`],
        { type: 'text/plain;charset=utf-8' }
    );
    const url = URL.createObjectURL(blob);
    const a   = document.createElement('a');
    a.href     = url;
    a.download = `jid-prediction-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
});
