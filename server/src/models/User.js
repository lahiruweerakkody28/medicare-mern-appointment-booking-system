import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 8, select: false },
  role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
  specialty: { type: String, trim: true, default: '' },
  location: { type: String, trim: true, default: '' },
  bio: { type: String, trim: true, maxlength: 1000, default: '' },
  approved: { type: Boolean, default: false }
}, { timestamps: true });

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
});
userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};
export default mongoose.model('User', userSchema);
