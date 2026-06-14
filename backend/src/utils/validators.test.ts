import { describe, it, expect } from 'vitest';
import { validatePAN, validateGST, validateEmail, validatePassword } from './validators.js';

describe('validators', () => {
  it('validates PAN correctly', () => {
    expect(validatePAN('ABCDE1234F')).toBe(true);
    expect(validatePAN('INVALID')).toBe(false);
  });

  it('validates GST correctly', () => {
    expect(validateGST('27AABCP1234D1Z5')).toBe(true);
    expect(validateGST('INVALID')).toBe(false);
  });

  it('validates email correctly', () => {
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('invalid')).toBe(false);
  });

  it('validates password strength', () => {
    const weak = validatePassword('weak');
    expect(weak.valid).toBe(false);

    const strong = validatePassword('Admin@123');
    expect(strong.valid).toBe(true);
  });
});
