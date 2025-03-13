// DOM elements
const loginSection = document.getElementById("login-section");
const passwordSection = document.getElementById("password-section");
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");
const addPasswordForm = document.getElementById("add-password-form");
const passwordList = document.getElementById("password-list");
const logoutButton = document.getElementById("logout-button");

// API Base URL
const BASE_URL = "https://api.example.com";

// Function to show login section
function showLoginSection() {
  loginSection.style.display = "block";
  passwordSection.style.display = "none";
}

// Function to show password section
function showPasswordSection() {
  loginSection.style.display = "none";
  passwordSection.style.display = "block";
}

// Function to fetch and display passwords
async function fetchPasswords() {
  try {
    const { token } = await chrome.storage.local.get("token");
    const response = await fetch(`${BASE_URL}/passwords/`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error("Failed to fetch passwords");

    const passwords = await response.json();
    passwordList.innerHTML = "";

    passwords.forEach((item) => {
      const passwordItem = document.createElement("div");
      passwordItem.classList.add("password-item");
      passwordItem.innerHTML = `
        <div class="domain">${item.domain}</div>
        <div>Username: ${item.username}</div>
        <div>Password: ${item.password}</div>
      `;
      passwordList.appendChild(passwordItem);
    });
  } catch (error) {
    console.error("Error fetching passwords:", error);
  }
}

// Handle login form submission
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      loginError.textContent = "Invalid username or password";
      return;
    }

    const data = await response.json();
    await chrome.storage.local.set({ token: data.token });
    loginError.textContent = "";
    showPasswordSection();
    fetchPasswords();
  } catch (error) {
    loginError.textContent = "An error occurred. Please try again.";
    console.error("Login error:", error);
  }
});

// Handle add password form submission
addPasswordForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const domain = document.getElementById("add-domain").value;
  const username = document.getElementById("add-username").value;
  const password = document.getElementById("add-password").value;

  try {
    const { token } = await chrome.storage.local.get("token");
    const response = await fetch(`${BASE_URL}/passwords/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ domain, username, password })
    });

    if (!response.ok) throw new Error("Failed to save password");

    alert("Password saved successfully!");
    fetchPasswords();
    addPasswordForm.reset();
  } catch (error) {
    console.error("Error saving password:", error);
  }
});

// Handle logout button
logoutButton.addEventListener("click", async () => {
  await chrome.storage.local.remove("token");
  showLoginSection();
});

// Check if the user is already logged in
(async () => {
  const { token } = await chrome.storage.local.get("token");
  if (token) {
    showPasswordSection();
    fetchPasswords();
  } else {
    showLoginSection();
  }
})();
