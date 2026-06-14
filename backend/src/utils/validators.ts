export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validatePAN(pan: string): boolean {
  return PAN_REGEX.test(pan.toUpperCase());
}

export function validateGST(gst: string): boolean {
  return GST_REGEX.test(gst.toUpperCase());
}

export function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (password.length < 8) errors.push('Password must be at least 8 characters');
  if (!/[A-Z]/.test(password)) errors.push('Password must contain an uppercase letter');
  if (!/[a-z]/.test(password)) errors.push('Password must contain a lowercase letter');
  if (!/[0-9]/.test(password)) errors.push('Password must contain a number');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Password must contain a special character');
  return { valid: errors.length === 0, errors };
}

export function validateIFSC(ifsc: string): boolean {
  return IFSC_REGEX.test(ifsc.toUpperCase());
}
