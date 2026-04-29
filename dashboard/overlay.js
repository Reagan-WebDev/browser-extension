document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('error');

    errorDiv.textContent = '';

    try {
        const response = await fetch('http://localhost:5000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Save token securely in local extension storage
            await chrome.storage.local.set({ token: data.token, user: data.user });
            
            // Redirect back to the intended URL or default to google
            const urlParams = new URLSearchParams(window.location.search);
            const target = urlParams.get('target');
            if (target && !target.startsWith('chrome-extension://')) {
                window.location.replace(target);
            } else {
                window.location.replace('https://www.google.com');
            }
        } else {
            errorDiv.textContent = data.message || 'Login failed';
        }
    } catch (err) {
        errorDiv.textContent = 'Server is unreachable';
    }
});
