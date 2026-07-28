import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
  validateCredentials,
} from '../src/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

describe('password hashing', () => {
  test('a hash verifies against its own plaintext', async () => {
    const hash = await hashPassword('matkhau123');
    expect(await verifyPassword('matkhau123', hash)).toBe(true);
  });

  test('a wrong password does not verify', async () => {
    const hash = await hashPassword('matkhau123');
    expect(await verifyPassword('matkhau124', hash)).toBe(false);
  });

  test('the hash never contains the plaintext', async () => {
    const hash = await hashPassword('matkhau123');
    expect(hash).not.toContain('matkhau123');
  });

  test('the same password hashes differently each time (salted)', async () => {
    const a = await hashPassword('matkhau123');
    const b = await hashPassword('matkhau123');
    expect(a).not.toBe(b);
    expect(await verifyPassword('matkhau123', b)).toBe(true);
  });
});

describe('token signing', () => {
  test('a signed token round-trips back to the user id', () => {
    const token = signToken('64b7f0c8e1a2b3c4d5e6f701');
    expect(verifyToken(token)).toBe('64b7f0c8e1a2b3c4d5e6f701');
  });

  test('a tampered token is rejected', () => {
    const token = signToken('64b7f0c8e1a2b3c4d5e6f701');
    expect(verifyToken(`${token}x`)).toBeNull();
  });

  test('garbage is rejected instead of throwing', () => {
    expect(verifyToken('not-a-token')).toBeNull();
  });
});

describe('validateCredentials', () => {
  test('accepts a valid email and password', () => {
    expect(validateCredentials({ email: 'sv@example.com', password: 'matkhau123' })).toEqual([]);
  });

  test('rejects an email without a domain', () => {
    const errors = validateCredentials({ email: 'sv@', password: 'matkhau123' });
    expect(errors).toContain('email không hợp lệ');
  });

  test('rejects a password shorter than 6 characters', () => {
    const errors = validateCredentials({ email: 'sv@example.com', password: '12345' });
    expect(errors).toContain('mật khẩu tối thiểu 6 ký tự');
  });

  test('rejects missing fields without throwing', () => {
    expect(validateCredentials({}).length).toBe(2);
  });
});
