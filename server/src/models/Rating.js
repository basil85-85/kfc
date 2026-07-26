const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  pace: { type: Number, min: 1, max: 99, required: true },
  shooting: { type: Number, min: 1, max: 99, required: true },
  passing: { type: Number, min: 1, max: 99, required: true },
  dribbling: { type: Number, min: 1, max: 99, required: true },
  defending: { type: Number, min: 1, max: 99, required: true },
  physical: { type: Number, min: 1, max: 99, required: true },
  overall: { type: Number, min: 1, max: 99 },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

ratingSchema.pre('save', function () {
  this.overall = Math.round(
    this.pace * 0.15 +
    this.shooting * 0.2 +
    this.passing * 0.2 +
    this.dribbling * 0.15 +
    this.defending * 0.15 +
    this.physical * 0.15
  );
});

module.exports = mongoose.model('Rating', ratingSchema);
