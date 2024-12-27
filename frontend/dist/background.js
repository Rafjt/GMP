const BASE_URL = "https://api.example.com"; // Adresse de votre backend Django

// Exemple : Fonction pour authentifier un utilisateur
async function authenticateUser(username, password) {
  try {
    const response = await fetch(`${BASE_URL}/auth/login/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error("Authentication failed");
    }

    const data = await response.json();
    chrome.storage.local.set({ token: data.token }); // Stocke le token JWT
    return data;
  } catch (error) {
    console.error("Error during authentication:", error);
  }
}

// Gestion des messages envoyés par popup.js ou content.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "login") {
    authenticateUser(request.username, request.password).then((data) => {
      sendResponse({ status: "success", token: data.token });
    });
    return true; // Permet une réponse asynchrone
  } else if (request.type === "fetch_passwords") {
    fetchPasswords().then((passwords) => sendResponse({ passwords }));
    return true;
  }
});

// Exemple : Fonction pour récupérer les mots de passe depuis Django
async function fetchPasswords() {
  const { token } = await chrome.storage.local.get("token");

  const response = await fetch(`${BASE_URL}/passwords/`, {
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error("Failed to fetch passwords");
  }

  return response.json();
}
