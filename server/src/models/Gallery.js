const mongoose = require('mongoose');

const gallerySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  date: { type: Date, default: Date.now },
  cover: { type: String, default: '' },
  photos: [
    {
      url: { type: String, required: true },
      caption: { type: String, trim: true, default: '' },
      likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    },
  ],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Gallery', gallerySchema);
