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
      "https://web-5000-103-127.cod-eu-west-3.hbtn.io/api/v1/auth/login",
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
