const API_CHAT = 'http://localhost:3000/api/chats';
const API_USER = 'http://localhost:3000/api/users';
const userId   = localStorage.getItem('user_id');
const token    = localStorage.getItem('jwt_token');

let userProfilePic = null;

if (!token || !userId) {
    window.location.href = 'index.html';
}

const messagesContainer = document.getElementById('messages');
const msgInput          = document.getElementById('msg-input');
const btnSend           = document.getElementById('btn-send');
const btnAdd            = document.getElementById('btn-add');
const btnLogout         = document.getElementById('nav-logout');

async function loadUserProfile() {
    if (!userId) return;
    try {
        const response = await fetch(`${API_USER}/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            const user = await response.json();
            if (user.profile_picture) {
                userProfilePic = `http://localhost:3000/${user.profile_picture}`;
            }
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

async function loadHistory() {
    try {
        const response = await fetch(`${API_CHAT}/user/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const history = await response.json();

        if (response.ok) {
            
            messagesContainer.innerHTML = '';

            if (history.length === 0) {
                appendMessage('สวัสดีครับ! 👋 ฉันชื่อ JID\nพูดคุยกับฉันได้เลยนะครับ', 'bot');
            } else {
                
                history.reverse().forEach(chat => {
                    appendMessage(chat.chat_text, chat.chat_user ? 'user' : 'bot', chat.created_at);
                });
            }
        }
    } catch (error) {
        console.error('Error loading history:', error);
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
}

function scrollBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function appendMessage(text, who , timestamp = null) {
    const row = document.createElement('div');
    row.className = `msg-row ${who}`;

    const av = document.createElement('div');
    av.className = `msg-av ${who === 'bot' ? 'bot-av' : 'user-av'}`;
    
    if (who === 'bot') {
        av.style.backgroundImage = `url('icon.png')`;
        av.style.backgroundSize = 'cover';
        av.style.backgroundPosition = 'center';
        av.innerHTML = ''; 
    } else {
        if (userProfilePic) {
            av.style.backgroundImage = `url('${userProfilePic}')`;
            av.style.backgroundSize = 'cover';
            av.style.backgroundPosition = 'center';
            av.innerHTML = '';
        } else {
            av.innerHTML = '<i class="fa-solid fa-user"></i>';
        }
    }

    const bubble = document.createElement('div');
    bubble.className = `msg-bubble ${who === 'bot' ? 'bot-bubble' : 'user-bubble'}`;

    const p = document.createElement('p');
    p.textContent = text;

    const ts = document.createElement('span');
    ts.className = 'msg-ts';
    const msgTime = timestamp ? new Date(timestamp) : new Date();
    ts.textContent = formatTime(msgTime);

    bubble.appendChild(p);
    bubble.appendChild(ts);
    row.appendChild(av);
    row.appendChild(bubble);

    messagesContainer.appendChild(row);
    scrollBottom();
}

function showTyping() {
    removeTyping();
    const row = document.createElement('div');
    row.id = 'typing-row';
    row.className = 'msg-row bot';

    const av = document.createElement('div');
    av.className = 'msg-av bot-av';
    av.style.backgroundImage = `url('icon.png')`;
    av.style.backgroundSize = 'cover';
    av.style.backgroundPosition = 'center';

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

async function sendMessage() {
    const text = msgInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    msgInput.value = '';
    btnSend.disabled = true;
    showTyping();

    try {
        
        const response = await fetch(`${API_CHAT}/reply`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ user_id: userId, chat_text: text })
        });
        
        const data = await response.json();
        removeTyping();

        if (response.ok) {
            appendMessage(data.reply, 'bot');
        } else {
            appendMessage('เกิดข้อผิดพลาดจาก AI: ' + (data.error || 'Unknown error'), 'bot');
        }

    } catch (err) {
        console.error('Chat error:', err);
        removeTyping();
        appendMessage('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์', 'bot');
    } finally {
        btnSend.disabled = false;
        msgInput.focus();
    }
}

btnSend.addEventListener('click', sendMessage);

msgInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});
if (btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('jwt_token');
        localStorage.removeItem('user_id');
        window.location.href = 'index.html';
    });
}

async function init() {
    await loadUserProfile();
    await loadHistory();
}

init();
