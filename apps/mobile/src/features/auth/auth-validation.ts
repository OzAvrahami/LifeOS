export function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function validateSignIn(email: string, password: string) {
  if (!email.trim() || !password) return 'צריך למלא אימייל וסיסמה.';
  if (!isValidEmail(email)) return 'כתובת מייל לא תקינה';
  return undefined;
}

export function validateSignUp(
  name: string,
  email: string,
  password: string,
  passwordConfirmation: string,
) {
  if (!name.trim() || !email.trim() || !password || !passwordConfirmation) {
    return 'צריך למלא את כל הפרטים.';
  }
  if (!isValidEmail(email)) return 'כתובת מייל לא תקינה';
  if (password.length < 8) return 'הסיסמה צריכה לכלול לפחות 8 תווים.';
  if (password !== passwordConfirmation) return 'הסיסמאות אינן תואמות';
  return undefined;
}

export function validatePasswordReset(password: string, passwordConfirmation: string) {
  if (!password || !passwordConfirmation) return 'צריך למלא את שתי הסיסמאות.';
  if (password.length < 8) return 'הסיסמה צריכה לכלול לפחות 8 תווים.';
  if (password !== passwordConfirmation) return 'הסיסמאות אינן תואמות';
  return undefined;
}
