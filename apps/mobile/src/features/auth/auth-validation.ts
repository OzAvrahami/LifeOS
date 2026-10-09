export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateSignIn(email: string, password: string) {
  if (!email.trim() || !password) return 'צריך למלא אימייל וסיסמה.';
  if (!isValidEmail(email)) return 'כתובת מייל לא תקינה';
  return undefined;
}

export function validateSignUp(
  _name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
) {
  if (!email.trim() || !password || !passwordConfirmation) {
    return 'צריך למלא את כל הפרטים.';
  }
  if (!isValidEmail(email)) return 'כתובת מייל לא תקינה';
  // The provider owns the configured length/strength policy; do not invent a hosted minimum.
  if (password !== passwordConfirmation) return 'הסיסמאות אינן תואמות';
  return undefined;
}

export function validatePasswordReset(password: string, passwordConfirmation: string) {
  if (!password || !passwordConfirmation) return 'צריך למלא את שתי הסיסמאות.';
  if (password !== passwordConfirmation) return 'הסיסמאות אינן תואמות';
  return undefined;
}
