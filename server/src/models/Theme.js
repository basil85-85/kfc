const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  primaryColor: { type: String, default: '#060B14' },
  secondaryColor: { type: String, default: '#0F1A2E' },
  accentColor: { type: String, default: '#FF6B1A' },
  backgroundColor: { type: String, default: '#060B14' },
  fontStyle: { type: String, enum: ['Bold', 'Classic', 'Modern'], default: 'Modern' },
  heroText: { type: String, default: 'Kolothum Kadhavu FC' },
  tagline: { type: String, default: 'Build the legacy. Own the pitch.' },
  logoURL: { type: String, default: '' },
  bannerURL: { type: String, default: '' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Theme', themeSchema);
