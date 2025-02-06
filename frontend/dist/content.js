// Détecter les champs de formulaire
const usernameField = document.querySelector('input[type="text"]');
const passwordField = document.querySelector('input[type="password"]');

if (usernameField && passwordField) {
  chrome.runtime.sendMessage(
    { type: "fetch_passwords", domain: window.location.hostname },
    (response) => {
      const { passwords } = response;
      if (passwords) {
        usernameField.value = passwords.username;
        passwordField.value = passwords.password;
      }
    }
  );
}
