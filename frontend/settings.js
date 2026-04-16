/* ══════════════════════════════════════════════
   settings.js  –  JID Settings Page
   ══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:5000/api/users';
const userId   = localStorage.getItem('user_id');
const token    = localStorage.getItem('jwt_token');

// ─── Auth Guard ─────────────────────────────
if (!token || !userId) {
    window.location.href = 'index.html';
}

// ─── DOM Refs ───────────────────────────────
const displayName  = document.getElementById('display-name');
const displayEmail = document.getElementById('display-email');
const displayPhone = document.getElementById('display-phone');

const inputFirstname = document.getElementById('input-firstname');
const inputLastname  = document.getElementById('input-lastname');
const inputEmail     = document.getElementById('input-email');
const inputPhone     = document.getElementById('input-phone');

const btnUpdate = document.getElementById('btn-update-settings');
const btnLogout = document.getElementById('nav-logout');

// ─── Load User Data ─────────────────────────
async function loadUserData() {
    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = await response.json();

        if (response.ok) {
            // Update display text
            const fullName = (user.firstname || user.lastname) 
                ? `${user.firstname || ''} ${user.lastname || ''}`.trim()
                : user.username;
            displayName.textContent = fullName;
            displayEmail.textContent = user.username;
            displayPhone.textContent = user.phone || 'No phone number';

            // Fill inputs
            inputFirstname.value = user.firstname || '';
            inputLastname.value  = user.lastname || '';
            inputEmail.value     = user.username || '';
            inputPhone.value     = user.phone || '';
        } else {
            console.error('Failed to load user:', user.error);
        }
    } catch (error) {
        console.error('Error fetching user:', error);
    }
}

// ─── Update Profile ─────────────────────────
btnUpdate.addEventListener('click', async () => {
    const updatedData = {
        firstname: inputFirstname.value.trim(),
        lastname:  inputLastname.value.trim(),
        username:  inputEmail.value.trim(),
        phone:     inputPhone.value.trim()
    };

    try {
        const response = await fetch(`${API_BASE}/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updatedData)
        });

        if (response.ok) {
            alert('บันทึกข้อมูลเรียบร้อยแล้ว!');
            loadUserData(); // Refresh view
        } else {
            const data = await response.json();
            alert('ล้มเหลวในการบันทึก: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating user:', error);
        alert('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }
});

// ─── Logout ─────────────────────────────────
btnLogout.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'index.html';
});

// Run
loadUserData();
