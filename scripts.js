const API_BASE_URL =
    `${window.location.protocol}//${window.location.host.replace(
        "web-80-",
        "web-5000-"
    )}/api/v1`;

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

/* =========================
   TASK 3: PLACE DETAILS
   ========================= */

/* Gets the place ID from: place.html?id=PLACE_ID */
function getPlaceIdFromURL() {
    const queryParameters = new URLSearchParams(window.location.search);

    return queryParameters.get("id");
}

/* Gets one place and its details from the API */
async function fetchPlaceDetails(token, placeId) {
    const placeDetails = document.getElementById("place-details");

    try {
        const headers = token
            ? { Authorization: `Bearer ${token}` }
            : {};

        const response = await fetch(
            `${API_BASE_URL}/places/${placeId}`,
            {
                method: "GET",
                headers: headers
            }
        );

        if (!response.ok) {
            throw new Error("Unable to fetch place details");
        }

        const place = await response.json();

        displayPlaceDetails(place);
        displayReviews(place.reviews || []);
    } catch (error) {
        console.error("Place details error:", error);

        if (placeDetails) {
            placeDetails.innerHTML =
                "<p>Unable to load place details.</p>";
        }
    }
}

/* Displays the selected place information */
function displayPlaceDetails(place) {
    const placeTitle = document.getElementById("place-title");
    const placeIntro = document.getElementById("place-intro");
    const placeDetails = document.getElementById("place-details");

    if (!placeDetails) {
        return;
    }

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

    const amenities = Array.isArray(place.amenities)
        ? place.amenities
        : [];

    const amenitiesHTML = amenities.length > 0
        ? amenities.map((amenity) => {
            const amenityName = amenity.name || amenity;
            return `<li>${amenityName}</li>`;
        }).join("")
        : "<li>No amenities available.</li>";

    if (placeTitle) {
        placeTitle.textContent = name;
    }

    if (placeIntro) {
        placeIntro.textContent = description;
    }

    placeDetails.innerHTML = `
        <h2>${name}</h2>

        <p>
            <strong>Price:</strong> $${price} per night
        </p>

        <p>
            <strong>Location:</strong> ${location}
        </p>

        <p>
            <strong>Description:</strong> ${description}
        </p>

        <h2>Amenities</h2>

        <ul>
            ${amenitiesHTML}
        </ul>
    `;
}

/* Displays all reviews for the selected place */
function displayReviews(reviews) {
    const reviewsList = document.getElementById("reviews-list");

    if (!reviewsList) {
        return;
    }

    reviewsList.innerHTML = "";

    if (reviews.length === 0) {
        reviewsList.innerHTML = "<p>No reviews yet.</p>";
        return;
    }

    reviews.forEach((review) => {
        const reviewCard = document.createElement("article");
        reviewCard.className = "review-card";

        const userName =
            review.user_name ||
            review.user ||
            "Anonymous user";

        const comment =
            review.comment ||
            review.text ||
            "No comment provided.";

        const rating = review.rating || "Not rated";

        reviewCard.innerHTML = `
            <p><strong>${userName}</strong></p>
            <p>${comment}</p>
            <p><strong>Rating:</strong> ${rating}/5</p>
        `;

        reviewsList.appendChild(reviewCard);
    });
}

/* Runs only on place.html */
document.addEventListener("DOMContentLoaded", () => {
    const placeDetails = document.getElementById("place-details");

    if (!placeDetails) {
        return;
    }

    const placeId = getPlaceIdFromURL();
    const token = getCookie("token");
    const addReviewSection = document.getElementById("add-review");
    const addReviewLink = document.getElementById("add-review-link");

    if (!placeId) {
        placeDetails.innerHTML =
            "<p>No place was selected.</p>";
        return;
    }

    if (addReviewSection) {
        addReviewSection.style.display = token ? "block" : "none";
    }

    if (token && addReviewLink) {
        addReviewLink.href =
            `add_review.html?place_id=${encodeURIComponent(placeId)}`;
    }

    fetchPlaceDetails(token, placeId);
});

/* =========================
   TASK 4: ADD REVIEW
   ========================= */

async function submitReview(token, placeId, reviewText, rating) {
    const response = await fetch(
        `${API_BASE_URL}/reviews/`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({
                text: reviewText,
                rating: Number(rating),
                place_id: placeId
            })
        }
    );

    let data = {};

    try {
        data = await response.json();
    } catch (error) {
        console.error("Review response error:", error);
    }

    if (!response.ok) {
        throw new Error(
            data.error || data.message || "Failed to submit review"
        );
    }

    return data;
}

/* Runs only on add_review.html */
document.addEventListener("DOMContentLoaded", () => {
    const reviewForm = document.getElementById("review-form");

    if (!reviewForm) {
        return;
    }

    const token = getCookie("token");
    const placeId = getPlaceIdFromURL();
    const reviewMessage = document.getElementById("review-message");

    /* Redirects users who are not logged in */
    if (!token) {
        window.location.href = "index.html";
        return;
    }

    /* Stops the form if it was opened without a selected place */
    if (!placeId) {
        reviewMessage.textContent =
            "No place was selected for this review.";
        reviewMessage.style.color = "#b42318";
        return;
    }

    reviewForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const reviewText = document.getElementById("review").value.trim();
        const rating = document.getElementById("rating").value;

        reviewMessage.textContent = "";

        try {
            await submitReview(token, placeId, reviewText, rating);

            reviewMessage.textContent =
                "Review submitted successfully!";
            reviewMessage.style.color = "#1f5a45";

            reviewForm.reset();
        } catch (error) {
            console.error("Review submission error:", error);

            reviewMessage.textContent = error.message;
            reviewMessage.style.color = "#b42318";
        }
    });
});
