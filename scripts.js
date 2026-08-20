const API_BASE_URL = window.location.hostname.endsWith("github.io")
  ? "https://hbnb-api-razan.onrender.com/api/v1"
  : `${window.location.protocol}//${window.location.host.replace("web-80-", "web-5000-")}/api/v1`;

/* =========================
   Shared authentication code
========================= */

function getCookie(name) {
  const prefix = `${name}=`;
  const cookies = document.cookie.split(";");

  for (const cookie of cookies) {
    const trimmedCookie = cookie.trim();

    if (trimmedCookie.startsWith(prefix)) {
      return decodeURIComponent(trimmedCookie.substring(prefix.length));
    }
  }

  return null;
}

function checkAuthentication() {
  const token = getCookie("token");
  const loginLink = document.getElementById("login-link");

  if (!loginLink) {
    return token;
  }

  if (token) {
    loginLink.textContent = "Logout";
    loginLink.href = "#";
    loginLink.style.display = "inline-block";

    loginLink.onclick = (event) => {
      event.preventDefault();

      document.cookie =
        "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";

      localStorage.removeItem("token");
      window.location.href = "index.html";
    };
  } else {
    loginLink.textContent = "Login";
    loginLink.href = "login.html";
    loginLink.style.display = "inline-block";
    loginLink.onclick = null;
  }

  return token;
}

/* =========================
   Task 1: Login
========================= */

async function loginUser(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => ({}));

    if (response.ok) {
      document.cookie = `token=${data.access_token}; path=/; SameSite=Lax`;
      window.location.href = "index.html";
    } else {
      alert(data.error || data.message || "Login failed");
    }
  } catch (error) {
    console.error("Login error:", error);
    alert("Unable to connect to the server");
  }
}

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

/* =========================
   Task 2: Places list
========================= */

async function fetchPlaces(token) {
  const placesList = document.getElementById("places-list");

  try {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(`${API_BASE_URL}/places/`, {
      headers
    });

    if (!response.ok) {
      throw new Error("Unable to load places");
    }

    const places = await response.json();
    displayPlaces(places);
  } catch (error) {
    console.error("Places error:", error);

    if (placesList) {
      placesList.innerHTML =
        "<p>Unable to load places. Please try again later.</p>";
    }
  }
}

function displayPlaces(places) {
  const placesList = document.getElementById("places-list");

  if (!placesList) {
    return;
  }

  placesList.innerHTML = "";

  if (!places || places.length === 0) {
    placesList.innerHTML = "<p>No places found.</p>";
    return;
  }

  places.forEach((place) => {
    const card = document.createElement("article");
    card.className = "place-card";
    card.dataset.price = place.price;

    const name = place.title || place.name || "Unnamed place";
    const description =
      place.description || "A comfortable Najdi-inspired stay in Riyadh.";
    const price = place.price ?? "Not available";

    card.innerHTML = `
      <div class="najdi-icon"><span></span></div>

      <h2>${name}</h2>

      <p class="place-description">${description}</p>

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

function filterPlaces(maxPrice) {
  const placeCards = document.querySelectorAll(".place-card");

  placeCards.forEach((card) => {
    const placePrice = Number(card.dataset.price);

    if (maxPrice === "all" || placePrice <= Number(maxPrice)) {
      card.style.display = "";
    } else {
      card.style.display = "none";
    }
  });
}

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
   Task 3: Place details
========================= */

function getPlaceIdFromURL() {
  const parameters = new URLSearchParams(window.location.search);
  return parameters.get("id") || parameters.get("place_id");
}

async function fetchPlaceDetails(token, placeId) {
  const detailsSection = document.getElementById("place-details");

  try {
    const headers = token
      ? { Authorization: `Bearer ${token}` }
      : {};

    const response = await fetch(
      `${API_BASE_URL}/places/${encodeURIComponent(placeId)}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error("Unable to load place details");
    }

    const place = await response.json();
    displayPlaceDetails(place);
  } catch (error) {
    console.error("Place details error:", error);

    if (detailsSection) {
      detailsSection.innerHTML =
        "<p>Unable to load this place. Please try again later.</p>";
    }
  }
}

function displayPlaceDetails(place) {
  const detailsSection = document.getElementById("place-details");

  if (!detailsSection) {
    return;
  }

  const name = place.title || place.name || "Unnamed place";
  const description =
    place.description || "A comfortable Najdi-inspired stay in Riyadh.";
  const price = place.price ?? "Not available";

  const owner = place.owner;
  const host = owner
    ? [owner.first_name, owner.last_name].filter(Boolean).join(" ")
    : "Al-Mabit Al-Najdi";

  const amenities = place.amenities || [];
  const amenitiesList = amenities.length
    ? amenities.map((amenity) => `<li>${amenity.name}</li>`).join("")
    : "<li>No amenities available.</li>";

  const pageTitle = document.getElementById("place-page-title");
  const addReviewLink = document.getElementById("add-review-link");

  if (pageTitle) {
    pageTitle.textContent = name;
  }

  if (addReviewLink) {
    addReviewLink.href =
      `add_review.html?id=${encodeURIComponent(place.id)}`;
  }

  detailsSection.innerHTML = `
    <div class="place-info">
      <h2>${name}</h2>

      <p><strong>Host:</strong> ${host}</p>

      <p><strong>Price:</strong> $${price} per night</p>

      <p><strong>Description:</strong> ${description}</p>

      <h2>Amenities</h2>

      <ul>
        ${amenitiesList}
      </ul>
    </div>
  `;

  displayReviews(place.reviews || []);
}

function displayReviews(reviews) {
  const reviewsSection = document.getElementById("reviews-list");

  if (!reviewsSection) {
    return;
  }

  reviewsSection.innerHTML = "";

  if (!reviews || reviews.length === 0) {
    reviewsSection.innerHTML = "<p>No reviews yet.</p>";
    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const rating = Math.max(0, Math.min(5, Number(review.rating) || 0));
    const stars = "★".repeat(rating) + "☆".repeat(5 - rating);

    card.innerHTML = `
      <p><strong>${review.user_name || "Guest"}</strong></p>

      <p>${review.text || "No comment provided."}</p>

      <p><strong>Rating:</strong> ${stars} (${rating}/5)</p>
    `;

    reviewsSection.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const detailsSection = document.getElementById("place-details");

  if (!detailsSection) {
    return;
  }

  const token = checkAuthentication();
  const placeId = getPlaceIdFromURL();
  const addReviewSection = document.getElementById("add-review");

  if (addReviewSection) {
    addReviewSection.style.display = token ? "block" : "none";
  }

  if (!placeId) {
    detailsSection.innerHTML = "<p>No place was selected.</p>";
    return;
  }

  fetchPlaceDetails(token, placeId);
});

/* =========================
   Task 4: Add review form
========================= */

async function submitReview(token, placeId, reviewText, rating) {
  const response = await fetch(`${API_BASE_URL}/reviews/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      text: reviewText,
      rating: Number(rating),
      place_id: Number(placeId)
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || data.message || "Failed to submit review");
  }

  return data;
}

document.addEventListener("DOMContentLoaded", () => {
  const reviewForm = document.getElementById("review-form");

  if (!reviewForm) {
    return;
  }

  const token = getCookie("token");
  const placeId = getPlaceIdFromURL();
  const reviewMessage = document.getElementById("review-message");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  if (!placeId) {
    if (reviewMessage) {
      reviewMessage.textContent = "No place was selected for this review.";
      reviewMessage.style.color = "#b42318";
    }

    return;
  }

  reviewForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const reviewText = document.getElementById("review").value.trim();
    const rating = document.getElementById("rating").value;

    if (reviewMessage) {
      reviewMessage.textContent = "";
    }

    try {
      await submitReview(token, placeId, reviewText, rating);

      if (reviewMessage) {
        reviewMessage.textContent = "Review submitted successfully!";
        reviewMessage.style.color = "#1f5a45";
      }

      reviewForm.reset();

	setTimeout(() => {
	   window.location.href = `place.html?id=${placeId}`;
	}, 1500);

    } catch (error) {
      console.error("Review submission error:", error);

      if (reviewMessage) {
        reviewMessage.textContent = error.message;
        reviewMessage.style.color = "#b42318";
      }
    }
  });
});
