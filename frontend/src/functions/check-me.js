import { API_AUTH_URL } from "../components/constant.js";
export { checkMe };

async function checkMe() {
  try {
    const response = await fetch(`${API_AUTH_URL}/me`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Include cookies in the request
    });

    // Parse and log the JSON response
    const result = await response.json();

    return result; // Return the result for further use if needed
  } catch (error) {
    // Log any errors that occur during the request
    console.error('Error during checkMe request:', error);
    return null; // Return null in case of an error
  }
}

