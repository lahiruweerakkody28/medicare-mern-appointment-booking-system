import { Router } from 'express';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect, allow('admin'));
router.get('/users', async (_req, res, next) => {
  try { res.json(await User.find().select('-password').sort({ createdAt: -1 })); }
  catch (e) { next(e); }
});
router.patch('/doctors/:id/approve', async (req, res, next) => {
  try {
    const doctor = await User.findOneAndUpdate({ _id: req.params.id, role: 'doctor' }, { approved: true }, { new: true }).select('-password');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (e) { next(e); }
});
router.delete('/users/:id', async (req, res, next) => {
  try {
    if (String(req.user._id) === req.params.id) return res.status(400).json({ message: 'You cannot remove your own admin account' });
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    await Appointment.deleteMany({ $or: [{ patient: user._id }, { doctor: user._id }] });
    await user.deleteOne();
    res.json({ message: 'User and associated appointments removed' });
  } catch (e) { next(e); }
});
export default router;
