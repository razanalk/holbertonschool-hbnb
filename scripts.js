document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;

            await LoginUser(email, password);
        });
    }

    const loginLink = document.getElementById('login-link');

    if (loginLink) {
        checkAuthentication();
    }

    const priceFilter = document.getElementById('price-filter');

    if (priceFilter) {
        priceFilter.addEventListener('change', filterPlaces);
    }
});


/* =========================
   Task 1 - Login
   ========================= */

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


/* =========================
   Task 2 - Index
   ========================= */

function getCookie(name) {
    const cookies = document.cookie.split(';');

    for (let cookie of cookies) {
        cookie = cookie.trim();

        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }

    return null;
}


function checkAuthentication() {
    const token = getCookie('token');
    const loginLink = document.getElementById('login-link');

    if (!loginLink) {
        return;
    }

    if (!token) {
        loginLink.style.display = 'block';
        return;
    }

    loginLink.style.display = 'none';

    fetchPlaces(token);
}


async function fetchPlaces(token) {
    try {
        const response = await fetch(
            'https://web-5000-230-10.cod-eu-west-3.hbtn.io/api/v1/places',
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (!response.ok) {
            console.error(
                'Failed to fetch places:',
                response.status,
                response.statusText
            );
            return;
        }

        const places = await response.json();

        displayPlaces(places);

    } catch (error) {
        console.error('Error fetching places:', error);
    }
}


function displayPlaces(places) {
    const placesList = document.getElementById('places-list');

    if (!placesList) {
        return;
    }

    placesList.innerHTML = '';

    places.forEach((place) => {
        const placeCard = document.createElement('article');

        placeCard.classList.add('place-card');

        placeCard.dataset.price = place.price;

        placeCard.innerHTML = `
            <div class="najdi-icon">
                <span class="house-icon">⌂</span>
            </div>

            <h3>${place.title}</h3>

            <p class="price">
                Price per night: $${place.price}
            </p>

            <p class="place-description">
                ${place.description || 'A beautiful place to stay.'}
            </p>

            <a href="place.html?id=${place.id}" class="details-button">
                View Details
            </a>
        `;

        placesList.appendChild(placeCard);
    });
}


function filterPlaces(event) {
    const selectedPrice = event.target.value;
    const placeCards = document.querySelectorAll('.place-card');

    placeCards.forEach((card) => {
        const placePrice = parseFloat(card.dataset.price);

        if (
            selectedPrice === 'all' ||
            placePrice <= parseFloat(selectedPrice)
        ) {
            card.style.display = '';
        } else {
            card.style.display = 'none';
        }
    });
}
