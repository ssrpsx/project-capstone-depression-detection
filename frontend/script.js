function toggleForms() {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (loginForm.classList.contains('active')) {
        loginForm.classList.remove('active');
        signupForm.classList.add('active');
    } else {
        signupForm.classList.remove('active');
        loginForm.classList.add('active');
    }
}

document.getElementById('form-login').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch('http://localhost:5000/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('jwt_token', data.token);
            alert('Logged in successfully! Token generated and saved.');
            // window.location.href = '/dashboard.html'; // Redirect upon successful login
        } else {
            alert('Login failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('Failed to connect to the server.');
    }
});

document.getElementById('form-signup').addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
    }

    try {
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password, firstname: '', lastname: '' })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Account created successfully! Please log in.');
            toggleForms(); // Switch back to login
        } else {
            alert('Signup failed: ' + (data.error || 'Unknown error'));
        }
    } catch (error) {
        console.error('Error during signup:', error);
        alert('Failed to connect to the server.');
    }
});
