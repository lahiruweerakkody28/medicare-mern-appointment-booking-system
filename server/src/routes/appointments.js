import { Router } from 'express';
import Appointment from '../models/Appointment.js';
import User from '../models/User.js';
import { protect, allow } from '../middleware/auth.js';
import { sendAppointmentEmail } from '../utils/email.js';

const router = Router();
router.use(protect, allow('patient'));

router.post('/', async (req, res, next) => {
  try {
    const { doctorId, startAt, patientReason = '' } = req.body;
    const start = new Date(startAt);
    if (!doctorId || !startAt || Number.isNaN(start.getTime()) || start <= new Date()) return res.status(400).json({ message: 'Choose a valid future appointment time' });
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor', approved: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found or not approved' });
    const end = new Date(start.getTime() + 30 * 60000);
    // Atomic conflict guard for the same doctor/time. A production deployment should use
    // a reservation/slot collection with a unique index for stronger concurrency guarantees.
    const conflict = await Appointment.findOne({
      doctor: doctor._id, startAt: start, status: { $in: ['pending', 'accepted'] }
    });
    if (conflict) return res.status(409).json({ message: 'This slot has just been booked. Please choose another time.' });
    const appointment = await Appointment.create({ patient: req.user._id, doctor: doctor._id, startAt: start, endAt: end, patientReason });
    await appointment.populate([{ path: 'patient', select: 'name email' }, { path: 'doctor', select: 'name specialty location' }]);
    await sendAppointmentEmail(appointment.patient.email, 'Appointment request received', `Hello ${appointment.patient.name}, your appointment request with Dr. ${appointment.doctor.name} for ${start.toLocaleString()} was received. Status: pending.`);
    res.status(201).json(appointment);
  } catch (e) { next(e); }
});

router.get('/mine', async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name specialty location').sort({ startAt: 1 });
    res.json(appointments);
  } catch (e) { next(e); }
});


router.patch('/:id/reschedule', async (req, res, next) => {
  try {
    const { startAt } = req.body;
    const start = new Date(startAt);
    if (!startAt || Number.isNaN(start.getTime()) || start <= new Date()) return res.status(400).json({ message: 'Choose a valid future appointment time' });
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.startAt <= new Date() || ['cancelled', 'declined', 'completed'].includes(appointment.status)) return res.status(400).json({ message: 'This appointment cannot be rescheduled' });
    const conflict = await Appointment.findOne({ _id: { $ne: appointment._id }, doctor: appointment.doctor, startAt: start, status: { $in: ['pending', 'accepted'] } });
    if (conflict) return res.status(409).json({ message: 'This slot has just been booked. Please choose another time.' });
    appointment.startAt = start;
    appointment.endAt = new Date(start.getTime() + 30 * 60000);
    appointment.status = 'pending';
    await appointment.save();
    const patient = await User.findById(req.user._id);
    const doctor = await User.findById(appointment.doctor);
    await sendAppointmentEmail(patient.email, 'Appointment reschedule request', `Hello ${patient.name}, your appointment request with Dr. ${doctor.name} has been moved to ${start.toLocaleString()}. Status: pending.`);
    res.json(appointment);
  } catch (e) { next(e); }
});

router.patch('/:id/cancel', async (req, res, next) => {
  try {
    const appointment = await Appointment.findOne({ _id: req.params.id, patient: req.user._id });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.startAt <= new Date() || ['cancelled', 'declined', 'completed'].includes(appointment.status)) return res.status(400).json({ message: 'This appointment cannot be cancelled' });
    appointment.status = 'cancelled';
    await appointment.save();
    const patient = await User.findById(req.user._id);
    await sendAppointmentEmail(patient.email, 'Appointment cancelled', `Hello ${patient.name}, your appointment on ${appointment.startAt.toLocaleString()} has been cancelled.`);
    res.json(appointment);
  } catch (e) { next(e); }
});
export default router;
