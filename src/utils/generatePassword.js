module.exports = function generateNewPassword() {
    const newPassword = Math.random().toString(36).slice(-8);
    return newPassword;
}