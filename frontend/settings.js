/* ══════════════════════════════════════════════
   settings.js  –  JID Settings Page
   ══════════════════════════════════════════════ */

const API_BASE = 'http://localhost:3000/api/users';
const userId   = localStorage.getItem('user_id');
const token    = localStorage.getItem('jwt_token');

// ─── Auth Guard ─────────────────────────────
if (!token || !userId) {
    window.location.href = 'index.html';
}

// ─── DOM Refs ───────────────────────────────
function togglePasswordVisibility(inputId) {
    const passwordInput = document.getElementById(inputId);
    const toggleButton = passwordInput.nextElementSibling;
    const eyeIcon = toggleButton.querySelector('.eye-icon');

    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
    } else {
        passwordInput.type = 'password';
        eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    }
}

const displayName  = document.getElementById('display-name');
const displayEmail = document.getElementById('display-email');
const displayPhone = document.getElementById('display-phone');

const inputFirstname = document.getElementById('input-firstname');
const inputLastname  = document.getElementById('input-lastname');
const inputEmail     = document.getElementById('input-email');
const inputPhone     = document.getElementById('input-phone');

const btnUpdate = document.getElementById('btn-update-settings');
const btnUpdatePassword = document.getElementById('btn-update-password');
const inputOldPassword = document.getElementById('input-old-password');
const inputNewPassword = document.getElementById('input-new-password');
const inputConfirmPassword = document.getElementById('input-confirm-password');

const btnLogout = document.getElementById('nav-logout');
const btnLogoutMobile = document.getElementById('btn-logout-mobile');

const fileUpload         = document.getElementById('file-upload');
const btnUpload          = document.getElementById('btn-upload');
const avatar_Upload      = document.getElementById('avatar-container');
const btnDelete          = document.getElementById('btn-delete');
const settingsProfileImg = document.getElementById('settings-profile-img');
const themeToggle        = document.getElementById('theme-toggle');
const themeLabel         = document.getElementById('theme-label');

// ─── Theme Toggle ───────────────────────────
if (localStorage.getItem('theme') === 'dark') {
    themeToggle.checked = true;
    if (themeLabel) themeLabel.textContent = 'Dark Mode';
} else {
    if (themeLabel) themeLabel.textContent = 'Light Mode';
}

themeToggle.addEventListener('change', (e) => {
    if (e.target.checked) {
        document.documentElement.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        if (themeLabel) themeLabel.textContent = 'Dark Mode';
    } else {
        document.documentElement.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        if (themeLabel) themeLabel.textContent = 'Light Mode';
    }
});

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
                settingsProfileImg.src = `http://localhost:3000/${user.profile_picture}`;
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

// ─── Update Password ────────────────────────
btnUpdatePassword.addEventListener('click', async () => {
    const oldPassword = inputOldPassword.value;
    const newPassword = inputNewPassword.value;
    const confirmPassword = inputConfirmPassword.value;

    if (!oldPassword || !newPassword || !confirmPassword) {
        alert('กรุณากรอกข้อมูลรหัสผ่านให้ครบถ้วน');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('รหัสผ่านใหม่ไม่ตรงกัน! กรุณาตรวจสอบอีกครั้ง');
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/change-password/${userId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ oldPassword, newPassword })
        });

        if (response.ok) {
            alert('เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!');
            inputOldPassword.value = '';
            inputNewPassword.value = '';
            inputConfirmPassword.value = '';
        } else {
            const data = await response.json();
            alert('ล้มเหลวในการเปลี่ยนรหัสผ่าน: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error updating password:', error);
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

avatar_Upload.addEventListener('click', () => {
    fileUpload.click();
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
            settingsProfileImg.src = `http://localhost:3000/${data.filePath}`;
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


// Run
loadUserData();
