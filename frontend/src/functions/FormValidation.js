export { isValidEmail, isValidPassword, isValidHttpsDomainOnlyUrl };
import { parse } from 'psl'

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    return regex.test(email);
}


function isValidPassword(password) {
    if (password.length < 12) return false;
    const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()\-_=+\[\]{}|;:,.?/~])(?=.*\d).{12,}$/;
    return regex.test(password);
}

function isValidHttpsDomainOnlyUrl(input) {
  try {
    // Ensure https:// prefix so URL constructor works
    const normalized = input.startsWith('https://') ? input : `https://${input}`;
    const url = new URL(normalized);

    // 1. Must use HTTPS
    if (url.protocol !== 'https:') return false;

    // 2. Must not contain path/query/fragment
    if (url.pathname !== '/' || url.search || url.hash) return false;

    // 3. Must be a valid registrable domain (not just 'co.uk' etc.)
    const parsed = parse(url.hostname);

    // Accept if domain is valid and matches full hostname (no subdomain)
    return parsed && parsed.domain === url.hostname && parsed.listed;
  } catch (e) {
    return false;
  }
}


