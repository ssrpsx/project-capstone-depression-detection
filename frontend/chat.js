/* ══════════════════════════════════════════════
   chat.js  –  MindChat
   (stub พร้อมเชื่อม AI chatbot ภายหลัง)
   ══════════════════════════════════════════════ */

// ─── DOM refs ─────────────────────────────────
const messages       = document.getElementById('messages');
const msgInput       = document.getElementById('msg-input');
const btnSend        = document.getElementById('btn-send');
const btnAdd         = document.getElementById('btn-add');
const displayUsername = document.getElementById('display-username');
const welcomeTs      = document.getElementById('welcome-ts');

// ─── Init: timestamp + username ──────────────
if (welcomeTs) welcomeTs.textContent = formatTime(new Date());

(function loadUsername() {
    try {
        const token = localStorage.getItem('jwt_token');
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.username) displayUsername.textContent = payload.username;
        }
    } catch (_) {}
})();

// ─── Tab switch ───────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// ─── Helpers ─────────────────────────────────
function formatTime(date) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function scrollBottom() {
    messages.scrollTop = messages.scrollHeight;
}

// ─── Append message row ───────────────────────
function appendMessage(text, who /* 'bot' | 'user' */) {
    const row = document.createElement('div');
    row.className = `row ${who}`;

    // avatar
    const av = document.createElement('div');
    av.className = `av ${who === 'bot' ? 'bot-av' : 'user-av'}`;
    av.innerHTML = who === 'bot'
        ? '<i class="fa-solid fa-robot"></i>'
        : '<i class="fa-solid fa-user"></i>';

    // bubble
    const bubble = document.createElement('div');
    bubble.className = `bubble ${who === 'bot' ? 'bot-bubble' : 'user-bubble'}`;

    const p = document.createElement('p');
    p.textContent = text;

    const ts = document.createElement('span');
    ts.className = 'ts';
    ts.textContent = formatTime(new Date());

    bubble.appendChild(p);
    bubble.appendChild(ts);
    row.appendChild(av);
    row.appendChild(bubble);

    messages.appendChild(row);
    scrollBottom();
}

// ─── Typing indicator ─────────────────────────
function showTyping() {
    removeTyping();
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'row bot';

    const av = document.createElement('div');
    av.className = 'av bot-av';
    av.innerHTML = '<i class="fa-solid fa-robot"></i>';

    const bubble = document.createElement('div');
    bubble.className = 'bubble bot-bubble typing-dots';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    row.appendChild(av);
    row.appendChild(bubble);
    messages.appendChild(row);
    scrollBottom();
}

function removeTyping() {
    const el = document.getElementById('typing-row');
    if (el) el.remove();
}

// ─── Send logic ───────────────────────────────
async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    msgInput.value = '';
    btnSend.disabled = true;
    showTyping();

    try {
        // ╔══════════════════════════════════════════╗
        // ║  TODO: เชื่อม AI chatbot endpoint ตรงนี้ ║
        // ╠══════════════════════════════════════════╣
        // const res = await fetch('http://localhost:5000/api/chat', {
        //     method: 'POST',
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`
        //     },
        //     body: JSON.stringify({ message: text })
        // });
        // const data = await res.json();
        // const reply = data.reply;
        // ╚══════════════════════════════════════════╝

        // ── Placeholder (ลบออกเมื่อเชื่อม AI จริง) ──
        await new Promise(r => setTimeout(r, 1100));
        const reply = '[AI response will appear here]';

        removeTyping();
        appendMessage(reply, 'bot');

    } catch (err) {
        console.error('Chat error:', err);
        removeTyping();
        appendMessage('เกิดข้อผิดพลาด กรุณาลองใหม่', 'bot');
    } finally {
        btnSend.disabled = false;
        msgInput.focus();
    }
}

// ─── Events ──────────────────────────────────
btnSend.addEventListener('click', sendMessage);

msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

btnAdd.addEventListener('click', () => {
    // TODO: file/image attachment
    alert('ฟีเจอร์แนบไฟล์ – เร็วๆ นี้');
});
