export function isUclEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  return normalized.length > '@ucl.lk'.length && normalized.endsWith('@ucl.lk') && !normalized.includes(' ');
}

export function validatePassword(password: string): string | null {
  if (password.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
    return 'Use at least one uppercase letter, one lowercase letter and one number.';
  }
  return null;
}

export function firebaseAuthMessage(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String(error.code) : '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'The email or password is incorrect.',
    'auth/invalid-email': 'Enter a valid UCL email address.',
    'auth/email-already-in-use': 'An account already exists for this email.',
    'auth/weak-password': 'Choose a stronger password with at least 8 characters.',
    'auth/user-disabled': 'This account has been disabled. Contact an administrator.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'permission-denied': 'You do not have permission to perform that action.',
  };
  return messages[code] || 'Something went wrong. Please try again.';
}
