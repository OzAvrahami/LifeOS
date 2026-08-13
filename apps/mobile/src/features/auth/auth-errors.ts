type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

export function authErrorMessage(error: unknown, context: 'sign-in' | 'sign-up' | 'resend' | 'reset' | 'update') {
  const authError = error as AuthErrorLike;
  const code = authError?.code?.toLowerCase() ?? '';
  const message = authError?.message?.toLowerCase() ?? '';
  const status = authError?.status;

  if (status === 429 || code.includes('rate') || message.includes('rate limit')) {
    return 'בוצעו יותר מדי ניסיונות. אפשר להמתין מעט ולנסות שוב.';
  }
  if (code.includes('network') || message.includes('network') || message.includes('fetch')) {
    return 'יש בעיה בחיבור. אפשר לנסות שוב.';
  }
  if (code.includes('email_not_confirmed') || message.includes('email not confirmed')) {
    return 'צריך לאמת את כתובת המייל לפני ההתחברות.';
  }
  if (
    code.includes('invalid_credentials') ||
    message.includes('invalid login credentials') ||
    message.includes('invalid credentials')
  ) {
    return 'אימייל או סיסמה שגויים';
  }
  if (
    code.includes('user_already_exists') ||
    message.includes('already registered') ||
    message.includes('already been registered')
  ) {
    return 'כבר קיים חשבון עם כתובת המייל הזו.';
  }
  if (code.includes('weak_password') || message.includes('password should be')) {
    return 'הסיסמה צריכה לכלול לפחות 8 תווים.';
  }
  if (
    code.includes('otp_expired') ||
    code.includes('flow_state') ||
    message.includes('expired') ||
    message.includes('invalid token')
  ) {
    return 'הקישור כבר לא בתוקף.';
  }

  switch (context) {
    case 'sign-in':
      return 'לא הצלחנו להתחבר כרגע. אפשר לנסות שוב.';
    case 'sign-up':
      return 'לא הצלחנו ליצור את החשבון כרגע. אפשר לנסות שוב.';
    case 'resend':
      return 'לא הצלחנו לשלוח שוב כרגע. אפשר לנסות בעוד רגע.';
    case 'reset':
      return 'לא הצלחנו לשלוח את הקישור כרגע. אפשר לנסות שוב.';
    case 'update':
      return 'לא הצלחנו לעדכן את הסיסמה. אפשר לבקש קישור חדש.';
  }
}
