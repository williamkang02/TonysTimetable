function validatePassword(pw) {
    return /[A-Z]/.test(pw) // At least one uppercase letter
        && /[0-9]/.test(pw) // At least one number
        && /[!@#$]/.test(pw) // At least one symbol
        && /^[A-Za-z0-9!@#$]+$/.test(pw) // No other characters
        && pw.length >= 6; // Length at least 6
}       