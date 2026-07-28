import { Router } from 'express';
import User from '../models/User.js';
import { hashPassword, verifyPassword, signToken, validateCredentials } from '../auth.js';
import { isValidLevel } from '../grade.js';
import requireAuth from '../middleware/requireAuth.js';

const router = Router();

const wrap = (fn) => (req, res, next) => fn(req, res, next).catch(next);

router.post(
  '/register',
  wrap(async (req, res) => {
    const errors = validateCredentials(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const email = req.body.email.trim().toLowerCase();
    if (await User.exists({ email })) {
      return res.status(409).json({ error: 'Email này đã được đăng ký' });
    }

    const user = await User.create({
      email,
      passwordHash: await hashPassword(req.body.password),
    });
    res.status(201).json({ token: signToken(user._id), user: user.toPublic() });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Thiếu email hoặc mật khẩu' });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Cùng một thông báo cho email sai và mật khẩu sai, tránh để lộ email nào đã tồn tại
    const ok = user && (await verifyPassword(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });

    res.json({ token: signToken(user._id), user: user.toPublic() });
  })
);

router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    res.json({ user: req.user.toPublic() });
  })
);

router.patch(
  '/level',
  requireAuth,
  wrap(async (req, res) => {
    const { educationLevel } = req.body || {};
    if (!isValidLevel(educationLevel)) {
      return res.status(400).json({ error: 'Bậc học không hợp lệ' });
    }
    req.user.educationLevel = educationLevel;
    await req.user.save();
    res.json({ user: req.user.toPublic() });
  })
);

export default router;
