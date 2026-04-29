fetch('http://localhost:5000/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
    })
}).then(async res => {
    const data = await res.json();
    console.log('Status code:', res.status);
    console.log('Response:', data);
}).catch(err => console.error(err));
