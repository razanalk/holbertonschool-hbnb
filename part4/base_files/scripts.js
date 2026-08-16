document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;

        await LoginUser(email, password);
    });
});

async function LoginUser(email, password) {
    try {
        const response = await fetch(
            'https://web-5000-230-10.cod-eu-west-3.hbtn.io/api/v1/auth/login',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );

        if (response.ok) {
            const data = await response.json();

            document.cookie = `token=${data.access_token}; path=/`;

            window.location.href = 'index.html';
        } else {
            alert('Login failed: ' + response.statusText);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Unable to connect to the server');
    }
}
