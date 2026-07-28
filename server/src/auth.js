import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const TOKEN_TTL = '7d';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, getJwtSecret(), { expiresIn: TOKEN_TTL });
}

/** Trả userId nếu token hợp lệ, null nếu sai/hết hạn. */
export function verifyToken(token) {
  try {
    return jwt.verify(token, getJwtSecret()).sub;
  } catch {
    return null;
  }
}

export function validateCredentials({ email, password }) {
  const errors = [];
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    errors.push('email không hợp lệ');
  }
  if (typeof password !== 'string' || password.length < 6) {
    errors.push('mật khẩu tối thiểu 6 ký tự');
  }
  return errors;
}
