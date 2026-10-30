import { Router } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const router = Router();
const publicUser = (user) => ({
  id: user._id, name: user.name, email: user.email, role: user.role,
  specialty: user.specialty, location: user.location, bio: user.bio, approved: user.approved
});
const sign = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2h' });

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, role = 'patient', specialty = '', location = '', bio = '' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email and password are required' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must contain at least 8 characters' });
    if (!['patient', 'doctor'].includes(role)) return res.status(400).json({ message: 'Invalid registration role' });
    const user = await User.create({ name, email, password, role, specialty, location, bio, approved: role === 'patient' });
    res.status(201).json({ token: sign(user), user: publicUser(user), message: role === 'doctor' ? 'Registration received. An admin must approve your account.' : 'Registration successful' });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'An account with this email already exists' });
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+password');
    if (!user || !(await user.comparePassword(password || ''))) return res.status(401).json({ message: 'Invalid email or password' });
    if (user.role === 'doctor' && !user.approved) return res.status(403).json({ message: 'Your doctor account is awaiting admin approval' });
    res.json({ token: sign(user), user: publicUser(user) });
  } catch (e) { next(e); }
});
export default router;
