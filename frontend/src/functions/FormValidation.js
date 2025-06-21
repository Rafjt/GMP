export { isValidEmail, isValidPassword };

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
}


function isValidPassword(password) {
    if (password.length < 12) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.?/~])(?=.*\d).{12,}$/;
    return regex.test(password);
}



