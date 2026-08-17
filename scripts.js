const API_BASE_URL =
    "https://web-5000-103-127.cod-eu-west-3.hbtn.io/api/v1";

/* =========================
   TASK 1: LOGIN
   ========================= */

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");

    if (!loginForm) {
        return;
    }

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        await loginUser(email, password);
    });
});

async function loginUser(email, password) {
    try {
        const response = await fetch(
            `${API_BASE_URL}/auth/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            }
        );

        const data = await response.json();

        if (response.ok) {
            document.cookie =
                `token=${data.access_token}; path=/; SameSite=Lax`;

            window.location.href = "index.html";
        } else {
            alert(data.error || data.message || "Login failed");
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Unable to connect to the server");
    }
}

/* =========================
   TASK 2: INDEX PAGE
   ========================= */

let allPlaces = [];

/* Reads a cookie by its name, for example: token */
function getCookie(name) {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);

    if (parts.length === 2) {
        return parts.pop().split(";").shift();
    }

    return null;
}

/* Shows Login only when there is no JWT token */
function checkAuthentication() {
    const token = getCookie("token");
    const loginLink = document.getElementById("login-link");

    if (loginLink) {
        loginLink.style.display = token ? "none" : "inline-block";
    }

    return token;
}

/* Gets all places from the API */
async function fetchPlaces(token) {
    const placesList = document.getElementById("places-list");

    try {
        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch(
            `${API_BASE_URL}/places/`,
            {
                method: "GET",
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error("Unable to fetch places");
        }

        const data = await response.json();

        /*
         * Supports either:
         * - an array: [...]
         * - an object containing: { places: [...] }
         */
        allPlaces = Array.isArray(data) ? data : (data.places || []);

        displayPlaces(allPlaces);
    } catch (error) {
        console.error("Places error:", error);

        if (placesList) {
            placesList.innerHTML =
                "<p>Unable to load places. Please try again later.</p>";
        }
    }
}

/* Creates and displays cards using the existing design classes */
function displayPlaces(places) {
    const placesList = document.getElementById("places-list");

    if (!placesList) {
        return;
    }

    placesList.innerHTML = "";

    if (places.length === 0) {
        placesList.innerHTML = "<p>No places found.</p>";
        return;
    }

    places.forEach((place) => {
        const card = document.createElement("article");
        card.className = "place-card";
        card.dataset.price = Number(place.price) || 0;

        const name = place.name || "Unnamed place";
        const description =
            place.description || "No description available.";
        const price = Number(place.price) || 0;

        let location = "Location not available";

        if (place.location) {
            location = place.location;
        } else if (
            place.latitude !== undefined &&
            place.longitude !== undefined
        ) {
            location = `${place.latitude}, ${place.longitude}`;
        }

        card.innerHTML = `
            <div class="najdi-icon"><span></span></div>
            <h2>${name}</h2>
            <p class="place-description">${description}</p>
            <p class="place-location">Location: ${location}</p>
            <p class="place-price">Price per night: $${price}</p>
            <a
                href="place.html?id=${encodeURIComponent(place.id)}"
                class="details-button"
            >
                View Details
            </a>
        `;

        placesList.appendChild(card);
    });
}

/* Hides or shows displayed cards without reloading the page */
function filterPlaces(maxPrice) {
    const placeCards = document.querySelectorAll(".place-card");

    placeCards.forEach((card) => {
        const placePrice = Number(card.dataset.price);

        if (maxPrice === "all" || placePrice <= Number(maxPrice)) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

/* Runs only on index.html because only it has #places-list */
document.addEventListener("DOMContentLoaded", () => {
    const placesList = document.getElementById("places-list");
    const priceFilter = document.getElementById("price-filter");

    if (!placesList || !priceFilter) {
        return;
    }

    const token = checkAuthentication();

    fetchPlaces(token);

    priceFilter.addEventListener("change", (event) => {
        filterPlaces(event.target.value);
    });
});
