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
const btnLogoutMobile = document.getElementById('btn-logout-mobile');

const fileUpload         = document.getElementById('file-upload');
const btnUpload          = document.getElementById('btn-upload');
const btnDelete          = document.getElementById('btn-delete');
const settingsProfileImg = document.getElementById('settings-profile-img');

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

            // Update profile image if exists
            if (user.profile_picture) {
                // Assuming backend serves from /uploads
                settingsProfileImg.src = `http://localhost:5000/${user.profile_picture}`;
            }
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

// ─── Profile Picture Upload ─────────────────
btnUpload.addEventListener('click', () => {
    fileUpload.click(); // Trigger hidden input
});

fileUpload.addEventListener('change', async (e) => {
    if (!e.target.files[0]) return;

    const formData = new FormData();
    formData.append('profile_picture', e.target.files[0]);

    try {
        const response = await fetch(`${API_BASE}/upload-profile-pic/${userId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });

        const data = await response.json();
        if (response.ok) {
            alert('อัปโหลดรูปโปรไฟล์เรียบร้อย!');
            settingsProfileImg.src = `http://localhost:5000/${data.filePath}`;
        } else {
            alert('อัปโหลดล้มเหลว: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('เกิดข้อผิดพลาดในการอัปโหลด');
    }
});

// ─── Delete Profile ──────────────────────────
btnDelete.addEventListener('click', async () => {
    const confirmDelete = confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโปรไฟล์? การดำเนินการนี้ไม่สามารถย้อนกลับได้ และข้อมูลทั้งหมดจะถูกลบ!');
    
    if (confirmDelete) {
        try {
            const response = await fetch(`${API_BASE}/${userId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                alert('ลบบัญชีของคุณเรียบร้อยแล้ว');
                localStorage.clear();
                window.location.href = 'index.html';
            } else {
                const data = await response.json();
                alert('ลบไม่สำเร็จ: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('เกิดข้อผิดพลาดในการลบโปรไฟล์');
        }
    }
});

// ─── Logout ──────────────────────────────────
const performLogout = (e) => {
    e.preventDefault();
    localStorage.clear();
    window.location.href = 'index.html';
};

if (btnLogout) btnLogout.addEventListener('click', performLogout);
if (btnLogoutMobile) btnLogoutMobile.addEventListener('click', performLogout);

const handleHelp = (e) => {
    e.preventDefault();
    alert('Help feature coming soon!');
};

const btnHelpDesktop = document.getElementById('nav-help');
const btnHelpMobile = document.getElementById('btn-help-mobile');

if (btnHelpDesktop) btnHelpDesktop.addEventListener('click', handleHelp);
if (btnHelpMobile) btnHelpMobile.addEventListener('click', handleHelp);

// Run
loadUserData();
