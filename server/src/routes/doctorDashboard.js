import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import { protect, allow } from '../middleware/auth.js';

const router = Router();
router.use(protect, allow('doctor'));

router.get('/appointments', async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctor: req.user._id })
      .populate('patient', 'name email').sort({ startAt: 1 });
    res.json(appointments);
  } catch (e) { next(e); }
});

router.patch('/appointments/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'declined', 'completed'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'pending' && status !== 'completed') return res.status(400).json({ message: 'Only pending requests can be accepted or declined' });
    appointment.status = status;
    await appointment.save();
    res.json(appointment);
  } catch (e) { next(e); }
});

router.patch('/appointments/:id/notes', async (req, res, next) => {
  try {
    const { notes = '' } = req.body;
    if (String(notes).length > 2000) return res.status(400).json({ message: 'Notes must be 2000 characters or fewer' });
    const appointment = await Appointment.findOne({ _id: req.params.id, doctor: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    appointment.doctorNotes = notes;
    await appointment.save();
    res.json({ message: 'Notes saved', doctorNotes: appointment.doctorNotes });
  } catch (e) { next(e); }
});
export default router;
