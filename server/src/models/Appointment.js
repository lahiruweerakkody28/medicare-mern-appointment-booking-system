import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  startAt: { type: Date, required: true, index: true },
  endAt: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed'], default: 'pending', index: true },
  patientReason: { type: String, maxlength: 500, default: '' },
  doctorNotes: { type: String, maxlength: 2000, default: '' }
}, { timestamps: true });

// Fast conflict lookup. Application logic below excludes declined/cancelled requests.
appointmentSchema.index({ doctor: 1, startAt: 1, status: 1 });
export default mongoose.model('Appointment', appointmentSchema);
