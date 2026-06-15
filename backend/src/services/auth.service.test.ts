import { describe, it, expect } from 'vitest';
import { registerSchema } from './auth.service.js';

describe('registerSchema', () => {
  const validPayload = {
    companyName: 'Test Corp',
    address: '123 Main Street, Mumbai',
    pan: 'ABCDE1234F',
    phone: '9876543210',
    email: 'test@example.com',
    password: 'Admin@123',
    confirmPassword: 'Admin@123',
  };

  it('accepts registration without GST', () => {
    const result = registerSchema.parse({ ...validPayload, gst: '' });
    expect(result.gst).toBeUndefined();
  });

  it('rejects mismatched passwords', () => {
    expect(() =>
      registerSchema.parse({ ...validPayload, confirmPassword: 'Wrong@123' }),
    ).toThrow();
  });

  it('uppercases PAN', () => {
    const result = registerSchema.parse({ ...validPayload, pan: 'abcde1234f' });
    expect(result.pan).toBe('ABCDE1234F');
  });
});
