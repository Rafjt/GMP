import { API_AUTH_URL } from "../components/constant.js";
export { logout,generatePassword };


async function logout() {
    try {
        const response = await fetch(`${API_AUTH_URL}/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        });
        const data = await response.json();
        if (response.ok) {
        return data;
        } else {
        return { error: "Logout failed" };
        }
    } catch (error) {
        console.error("Error:", error);
        return { error: "Logout failed" };
    }
}

function generatePassword(length, useNumbers = true, useSymbols = true) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+[]{}|;:,.<>?';
  
    // Construction du charset selon les options
    let charset = lowercase + uppercase;
    if (useNumbers) charset += numbers;
    if (useSymbols) charset += symbols;
  
    const array = new Uint32Array(length);
    window.crypto.getRandomValues(array);
  
    return Array.from(array)
      .map(x => charset[x % charset.length])
      .join('');
  }
  