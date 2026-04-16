/* ══════════════════════════════════════════════
   chat.js  –  JID Chat App
   ══════════════════════════════════════════════ */

const API_CHAT = 'http://localhost:5000/api/chats';
const userId   = localStorage.getItem('user_id');
const token    = localStorage.getItem('jwt_token');

// ─── Auth Guard ─────────────────────────────
if (!token || !userId) {
    window.location.href = 'index.html';
}

// ─── DOM refs ─────────────────────────────────
const messagesContainer = document.getElementById('messages');
const msgInput          = document.getElementById('msg-input');
const btnSend           = document.getElementById('btn-send');
const btnAdd            = document.getElementById('btn-add');
const btnLogout         = document.getElementById('nav-logout');

// ─── Init Load ────────────────────────────────
async function loadHistory() {
    try {
        const response = await fetch(`${API_CHAT}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await response.json();

        if (response.ok) {
            // Clear current welcome or existing messages
            messagesContainer.innerHTML = '';
            
            // Re-append welcome if empty
            if (history.length === 0) {
                appendMessage('สวัสดีครับ! 👋 ฉันชื่อ JID\nพูดคุยกับฉันได้เลยนะครับ', 'bot');
            } else {
                // history returns newest first normally in my route, let's reverse to show chronological
                history.reverse().forEach(chat => {
                    appendMessage(chat.chat_text, chat.chat_user ? 'user' : 'bot');
                });
            }
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

// ─── Helpers ─────────────────────────────────
function formatTime(date) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function scrollBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ─── Append message row ───────────────────────
function appendMessage(text, who /* 'bot' | 'user' */) {
    const row = document.createElement('div');
    row.className = `msg-row ${who}`;

    // avatar
    const av = document.createElement('div');
    av.className = `msg-av ${who === 'bot' ? 'bot-av' : 'user-av'}`;
    // Using simple icons or dots as in the refined UI
    if (who === 'bot') {
        av.innerHTML = ''; // Keep it as a blue dot if that's the current CSS style
    } else {
        av.innerHTML = '<i class="fa-solid fa-user"></i>';
    }

    // bubble
    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${who === 'bot' ? 'bot-bubble' : 'user-bubble'}`;

    const p = document.createElement('p');
    p.textContent = text;

    const ts = document.createElement('span');
    ts.className = 'msg-ts';
    ts.textContent = formatTime(new Date());

    bubble.appendChild(p);
    bubble.appendChild(ts);
    row.appendChild(av);
    row.appendChild(bubble);

    messagesContainer.appendChild(row);
    scrollBottom();
}

// ─── Typing indicator ─────────────────────────
function showTyping() {
    removeTyping();
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'msg-row bot';

    const av = document.createElement('div');
    av.className = 'msg-av bot-av';

    const bubble = document.createElement('div');
    bubble.className = 'msg-bubble bot-bubble typing-dots';
    bubble.innerHTML = '<span></span><span></span><span></span>';

    row.appendChild(av);
    row.appendChild(bubble);
    messagesContainer.appendChild(row);
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

    // 1. Show message in UI
    appendMessage(text, 'user');
    msgInput.value = '';
    btnSend.disabled = true;
    showTyping();

    try {
        // 2. Save to database
        await fetch(API_CHAT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, chat_text: text, chat_user: true })
        });

        // 3. AI response placeholder
        // TODO: Replace with real AI API call
        await new Promise(r => setTimeout(r, 1500));
        const reply = "ขอบคุณที่บอกเล่าเรื่องราวให้ฟังนะครับ ฉันยินดีรับฟังเสมอครับ [AI Mock Response]";

        // 4. Save AI response to DB (Optional, but keeps history consistent)
        await fetch(API_CHAT, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, chat_text: reply, chat_user: false })
        });

        removeTyping();
        appendMessage(reply, 'bot');

    } catch (err) {
        console.error('Chat error:', err);
        removeTyping();
        appendMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'bot');
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

btnLogout.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
});

// Run Init
loadHistory();
