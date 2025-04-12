import { API_AUTH_URL } from "../components/constant.js";
export { logout };


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