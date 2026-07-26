const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  player: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['monthly_fee', 'session_fee', 'rent', 'other'], default: 'other' },
  status: { type: String, enum: ['pending', 'paid', 'overdue', 'waived'], default: 'pending' },
  razorpayOrderId: { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  paidAt: { type: Date },
  dueDate: { type: Date },
  description: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
