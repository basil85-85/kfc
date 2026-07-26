const crypto = require('crypto');
const { getRazorpayInstance } = require('../utils/razorpay');
const Payment = require('../models/Payment');

const getMyPayments = async (req, res) => {
  const payments = await Payment.find({ player: req.user._id }).sort({ createdAt: -1 });
  res.json(payments);
};

const getAllPayments = async (req, res) => {
  const payments = await Payment.find().populate('player', 'name email');
  res.json(payments);
};

const createPaymentRecord = async (req, res) => {
  const { player, amount, type, dueDate, description } = req.body;
  const payment = await Payment.create({
    player,
    amount,
    type,
    dueDate,
    description,
    createdBy: req.user._id,
  });
  res.status(201).json(payment);
};

const createOrder = async (req, res) => {
  const { paymentId, amount, currency = 'INR', description } = req.body;
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  if (payment.status === 'paid') {
    res.status(400);
    throw new Error('Payment already completed');
  }
  const order = await getRazorpayInstance().orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: `payment_${paymentId}`,
    payment_capture: 1,
  });
  payment.razorpayOrderId = order.id;
  await payment.save();
  res.json({ order, key: process.env.RAZORPAY_KEY_ID, paymentId: payment._id });
};

const verifyPayment = async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature, paymentId } = req.body;

  if (!process.env.RAZORPAY_KEY_SECRET) {
    res.status(500);
    throw new Error('Razorpay secret is missing. Please set RAZORPAY_KEY_SECRET.');
  }

  const body = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    res.status(400);
    throw new Error('Payment verification failed');
  }

  const payment = await Payment.findById(paymentId);
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  payment.status = 'paid';
  payment.paidAt = new Date();
  payment.razorpayPaymentId = razorpayPaymentId;
  await payment.save();
  res.json(payment);
};

const markPaid = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  payment.status = 'paid';
  payment.paidAt = new Date();
  await payment.save();
  res.json(payment);
};

const bulkDeletePayments = async (req, res) => {
  const { paymentIds } = req.body;

  if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
    res.status(400);
    throw new Error('Please provide an array of paymentIds to delete');
  }

  try {
    const result = await Payment.deleteMany({ _id: { $in: paymentIds } });

    res.json({
      message: `${result.deletedCount} payment record(s) deleted successfully`,
      deletedCount: result.deletedCount,
      requestedCount: paymentIds.length,
    });
  } catch (error) {
    res.status(500);
    throw new Error(`Failed to bulk delete payment records: ${error.message}`);
  }
};

const getPaymentSummary = async (req, res) => {
  const { team, status, search } = req.query;
  let payments = await Payment.find().populate({
    path: 'player',
    select: 'name email team',
    populate: { path: 'team', select: 'name' },
  }).lean();

  if (team) {
    payments = payments.filter((p) => {
      const pTeamId = p.player?.team?._id || p.player?.team;
      return String(pTeamId) === String(team);
    });
  }

  if (status && status !== 'all') {
    payments = payments.filter((p) => p.status === status);
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    payments = payments.filter((p) => {
      const name = p.player?.name || '';
      const desc = p.description || '';
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }

  const now = new Date();
  let totalCollected = 0;
  let totalPending = 0;
  let totalOverdue = 0;
  let countPaid = 0;
  let countPending = 0;
  let countOverdue = 0;

  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (p.status === 'paid') {
      totalCollected += amt;
      countPaid += 1;
    } else {
      totalPending += amt;
      countPending += 1;
      if (p.dueDate && new Date(p.dueDate) < now) {
        countOverdue += 1;
        totalOverdue += amt;
      }
    }
  });

  res.json({
    totalCollected,
    totalPending,
    totalOverdue,
    countPaid,
    countPending,
    countOverdue,
    totalRecords: payments.length,
  });
};

const bulkCreatePayments = async (req, res) => {
  const { playerIds, amount, type, dueDate, description } = req.body;

  if (!Array.isArray(playerIds) || playerIds.length === 0) {
    res.status(400);
    throw new Error('Please select at least one player to issue payments.');
  }

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    res.status(400);
    throw new Error('Please provide a valid payment amount.');
  }

  const docs = playerIds.map((playerId) => ({
    player: playerId,
    amount: Number(amount),
    type: type || 'monthly_fee',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    description: description || '',
    createdBy: req.user._id,
  }));

  const inserted = await Payment.insertMany(docs);
  res.status(201).json({
    success: true,
    count: inserted.length,
    message: `Created ${inserted.length} payment invoice(s) successfully.`,
  });
};

const exportPaymentPdf = async (req, res) => {
  const PDFDocument = require('pdfkit');
  const { team, status, search } = req.query;
  let payments = await Payment.find().populate({
    path: 'player',
    select: 'name email team',
    populate: { path: 'team', select: 'name' },
  }).sort({ createdAt: -1 }).lean();

  if (team) {
    payments = payments.filter((p) => {
      const pTeamId = p.player?.team?._id || p.player?.team;
      return String(pTeamId) === String(team);
    });
  }

  if (status && status !== 'all') {
    payments = payments.filter((p) => p.status === status);
  }

  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    payments = payments.filter((p) => {
      const name = p.player?.name || '';
      const desc = p.description || '';
      return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
    });
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=KFC_Payment_Ledger.pdf');

  doc.pipe(res);

  // Header Banner
  doc.rect(40, 40, 515, 60).fill('#0f172a');
  doc.fillColor('#00d2ff').fontSize(18).font('Helvetica-Bold').text('KFC — Kolothum Kadhavu FC', 55, 52);
  doc.fillColor('#94a3b8').fontSize(10).font('Helvetica').text('Official Club Financial Ledger & Payment Report', 55, 76);

  doc.fillColor('#94a3b8').fontSize(9).text(`Generated: ${new Date().toLocaleDateString()}`, 380, 52, { align: 'right' });
  if (status || team || search) {
    doc.text(`Filter: Status=${status || 'All'}, Team=${team || 'All'}`, 380, 68, { align: 'right' });
  }

  doc.moveDown(3);

  // Financial Totals Summary Boxes
  const now = new Date();
  let totalCollected = 0;
  let totalPending = 0;
  let countOverdue = 0;

  payments.forEach((p) => {
    const amt = Number(p.amount) || 0;
    if (p.status === 'paid') totalCollected += amt;
    else {
      totalPending += amt;
      if (p.dueDate && new Date(p.dueDate) < now) countOverdue += 1;
    }
  });

  const startY = 120;
  // Box 1: Collected
  doc.rect(40, startY, 160, 45).fillAndStroke('#10b98115', '#10b981');
  doc.fillColor('#065f46').fontSize(8).font('Helvetica-Bold').text('TOTAL COLLECTED', 50, startY + 8);
  doc.fillColor('#047857').fontSize(13).text(`INR ${totalCollected.toLocaleString('en-IN')}`, 50, startY + 22);

  // Box 2: Pending
  doc.rect(215, startY, 160, 45).fillAndStroke('#f59e0b15', '#f59e0b');
  doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold').text('TOTAL PENDING', 225, startY + 8);
  doc.fillColor('#b45309').fontSize(13).text(`INR ${totalPending.toLocaleString('en-IN')}`, 225, startY + 22);

  // Box 3: Overdue Count
  doc.rect(390, startY, 165, 45).fillAndStroke('#ef444415', '#ef4444');
  doc.fillColor('#991b1b').fontSize(8).font('Helvetica-Bold').text('OVERDUE INVOICES', 400, startY + 8);
  doc.fillColor('#b91c1c').fontSize(13).text(`${countOverdue} Record(s)`, 400, startY + 22);

  // Table Headers
  const tableY = startY + 60;
  doc.rect(40, tableY, 515, 20).fill('#1e293b');
  doc.fillColor('#ffffff').fontSize(9).font('Helvetica-Bold');
  doc.text('Player Name', 48, tableY + 5);
  doc.text('Team', 170, tableY + 5);
  doc.text('Type', 270, tableY + 5);
  doc.text('Amount', 350, tableY + 5);
  doc.text('Due Date', 430, tableY + 5);
  doc.text('Status', 500, tableY + 5);

  let y = tableY + 24;
  doc.font('Helvetica').fontSize(8);

  payments.forEach((p, idx) => {
    if (y > 750) {
      doc.addPage();
      y = 40;
    }

    const bg = idx % 2 === 0 ? '#f8fafc' : '#ffffff';
    doc.rect(40, y - 4, 515, 18).fill(bg);

    doc.fillColor('#0f172a').text(p.player?.name || 'Player', 48, y, { width: 115, height: 14 });
    doc.fillColor('#475569').text(p.player?.team?.name || 'Unassigned', 170, y, { width: 95, height: 14 });
    doc.fillColor('#475569').text((p.type || 'fee').replace('_', ' '), 270, y, { width: 75, height: 14 });
    doc.fillColor('#0f172a').text(`INR ${p.amount}`, 350, y, { width: 75, height: 14 });
    doc.fillColor('#64748b').text(p.dueDate ? new Date(p.dueDate).toLocaleDateString() : '—', 430, y, { width: 65, height: 14 });

    if (p.status === 'paid') {
      doc.fillColor('#047857').font('Helvetica-Bold').text('PAID', 500, y);
    } else {
      doc.fillColor('#b91c1c').font('Helvetica-Bold').text('PENDING', 500, y);
    }

    doc.font('Helvetica');
    y += 18;
  });

  doc.end();
};

const deletePayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Payment record not found');
  }
  await payment.deleteOne();
  res.json({ message: 'Payment record deleted' });
};

module.exports = {
  getMyPayments,
  getAllPayments,
  createPaymentRecord,
  createOrder,
  verifyPayment,
  markPaid,
  deletePayment,
  bulkDeletePayments,
  getPaymentSummary,
  bulkCreatePayments,
  exportPaymentPdf,
};
