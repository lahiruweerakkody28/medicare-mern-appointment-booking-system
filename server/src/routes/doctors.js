import { Router } from 'express';
import User from '../models/User.js';
import Appointment from '../models/Appointment.js';

const router = Router();
router.get('/', async (req, res, next) => {
  try {
    const { search = '', specialty = '', location = '' } = req.query;
    const filter = { role: 'doctor', approved: true };
    if (search) filter.name = { $regex: String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    if (specialty) filter.specialty = { $regex: String(specialty), $options: 'i' };
    if (location) filter.location = { $regex: String(location), $options: 'i' };
    const doctors = await User.find(filter).select('name specialty location bio');
    res.json(doctors);
  } catch (e) { next(e); }
});

// Slots are generated in 30-minute increments between 09:00 and 17:00 server-local time.
// For production, store each clinic's timezone and business hours explicitly.
router.get('/:id/slots', async (req, res, next) => {
  try {
    const date = String(req.query.date || '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ message: 'date must be YYYY-MM-DD' });
    const doctor = await User.findOne({ _id: req.params.id, role: 'doctor', approved: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    const dayStart = new Date(`${date}T00:00:00`);
    const appointments = await Appointment.find({
      doctor: doctor._id, startAt: { $gte: dayStart, $lt: new Date(dayStart.getTime() + 86400000) },
      status: { $in: ['pending', 'accepted'] }
    }).select('startAt');
    const taken = new Set(appointments.map(a => a.startAt.toISOString()));
    const slots = [];
    for (let minutes = 9 * 60; minutes < 17 * 60; minutes += 30) {
      const d = new Date(`${date}T${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}:00`);
      if (d > new Date() && !taken.has(d.toISOString())) slots.push(d.toISOString());
    }
    res.json(slots);
  } catch (e) { next(e); }
});
export default router;
