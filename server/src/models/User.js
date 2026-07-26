const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['player', 'manager', 'admin'], default: 'player' },
  position: { type: String, enum: ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST'], default: 'CM' },
  jersey: { type: Number, min: 1 },
  photoURL: { type: String, default: '' },
  highlightVideoUrl: { type: String, default: '' },
  highlightVideoEmbed: { type: String, default: '' },
  aboutMe: { type: String, maxlength: 300, default: '' },
  team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
  active: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: true },
  smsNotificationsEnabled: { type: Boolean, default: true },

  verificationCode: { type: String, default: '' },
  verificationCodeExpires: { type: Date },
  failedVerificationAttempts: { type: Number, default: 0 },
  verificationLockoutUntil: { type: Date },
  lastVerificationSentAt: { type: Date },
  playerCode: { type: String, unique: true, sparse: true, trim: true },
  joinedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

