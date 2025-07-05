import { API_AUTH_URL,API_BASE_URL,API_2FA_URL } from "../components/constant.js";
export { logout,generatePassword,pullPassword,deletePassword,createPassword,
    loginUser,getSalt,updatePassword,changeMasterPassword,deleteAccount,fetch2faStatusApi,
    verify2FACode, toggle2faApi };

async function pullPassword() {
    try {
        const response = await fetch(`${API_BASE_URL}/ciphered/password`, {
            method: "GET",
            credentials: "include",
        });
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error("JSON parsing error:", jsonError);
            return { error: "Received malformed data from the server." };
        }

        if (response.ok) {
            return data;
        } else {
            return {
                error: data?.message || "Failed to pull passwords.",
                status: response.status
            };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { error: "Network error: Could not reach the server. Please try again." };
    }
}

async function deletePassword(id) {
    try {
        const response = await fetch (`${API_BASE_URL}/ciphered/password/${id}`, {
            method: "DELETE",
            credentials: "include"
        });
        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            return {
                error: data?.message || "Failed to delete passwords.",
                status: response.status
            };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { error: "Network error: Could not reach the server. Please try again." };
    }
}

async function createPassword(name,value,description,url) {
    try {
        const response = await fetch (`${API_BASE_URL}/ciphered/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, password: value, description, url })
        });
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            return {
                error: data?.message || "Failed to create password.",
                status: response.status
            };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { error: "Network error: Could not reach the server. Please try again." };
    }
}

async function updatePassword(id,name,value,description,url) {
    try {
        const response = await fetch (`${API_BASE_URL}/ciphered/password/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ name, password: value, description, url })
        });
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            return {
                error: data?.message || "Failed to update password.",
                status: response.status
            };
        }
    } catch (error) {
        console.error("Network or unexpected error:", error);
        return { error: "Network error: Could not reach the server. Please try again." };
    }
}

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

  let charset = lowercase + uppercase;
  const mandatory = [];
  
  if (useNumbers) {
    charset += numbers;
    mandatory.push(numbers[Math.floor(Math.random() * numbers.length)]);
  }
  if (useSymbols) {
    charset += symbols;
    mandatory.push(symbols[Math.floor(Math.random() * symbols.length)]);
  }

  mandatory.push(
    lowercase[Math.floor(Math.random() * lowercase.length)],
    uppercase[Math.floor(Math.random() * uppercase.length)]
  );

  const remainingLength = length - mandatory.length;
  const array = new Uint32Array(remainingLength);
  window.crypto.getRandomValues(array);

  const password = Array.from(array)
    .map(x => charset[x % charset.length])
    .concat(mandatory)
    .sort(() => Math.random() - 0.5) // Shuffle
    .join('');

  return password;
}


async function loginUser(email, password) {
    try {
        const response = await fetch(`${API_AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            return data;
        } else {
            return { error: data.message || "Login failed" };
        }
    } catch (error) {
        console.error("Error:", error);
        return { error: "Login failed" };
    }
}

async function getSalt() {
    try {
        const response = await fetch(`${API_BASE_URL}/get_salt`, {
            method: "GET",
            credentials: "include"
        });
        const data = await response.json();
        if (response.ok && data[0]?.salt) {
            return { salt: data[0].salt };
        } else {
            return { error: "Failed to retrieve salt" };
        }
    } catch (error) {
        console.error("Error:", error);
        return { error: "Failed to retrieve salt" };
    }
}

async function changeMasterPassword(oldPassword, newPassword) {
  try {
    const response = await fetch(`${API_BASE_URL}/master/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        oldPassword,
        newPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Password update failed');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Password change error:', error);
    return { success: false, error: error.message };
  }
}

async function deleteAccount() {
  console.log("DBG: deleteAccount() has been called")
  try {
    const response = await fetch(`${API_AUTH_URL}/deleteAccount`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
      throw new Error('Unexpected response type');
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Account deletion failed');
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.error('Network or unexpected error:', error);
    return { success: false, error: error.message };
  }
}


async function verify2FACode(userId, code) {
  try {
    const response = await fetch(`${API_2FA_URL}/verify-2fa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        code: code.trim(),
      }),
    });
    return await response.json();
  } catch (err) {
    return { success: false, error: "Server error." };
  }
}


async function fetch2faStatusApi() {
  try {
    const response = await fetch(`${API_2FA_URL}/isEnabled`, {
      method: "GET",
      credentials: "include"
    });
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0 && 'enabled' in data[0]) {
      return { enabled: data[0].enabled };
    } else {
      return { enabled: null, error: "Malformed response" };
    }
  } catch (error) {
    return { enabled: null, error: error.message || "Network error" };
  }
}

async function toggle2faApi(enabled) {
  try {
    const endpoint = enabled === 1 ? 'disable' : 'enable';
    const response = await fetch(`${API_2FA_URL}/${endpoint}`, {
      method: "POST",
      credentials: "include"
    });
    return await response.json();
  } catch (error) {
    return { success: false, error: error.message || "Network error" };
  }
}
