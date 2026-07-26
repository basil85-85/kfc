const express = require('express');
const {
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
} = require('../controllers/paymentController');
const { protect, admin } = require('../middleware/authMiddleware');
const router = express.Router();

router.get('/my', protect, getMyPayments);
router.get('/summary', protect, admin, getPaymentSummary);
router.get('/export-pdf', protect, admin, exportPaymentPdf);
router.get('/', protect, admin, getAllPayments);
router.post('/', protect, admin, createPaymentRecord);
router.post('/bulk-create', protect, admin, bulkCreatePayments);
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.patch('/:id/mark-paid', protect, admin, markPaid);
router.delete('/bulk', protect, admin, bulkDeletePayments);
router.delete('/admin/bulk', protect, admin, bulkDeletePayments);
router.post('/bulk-delete', protect, admin, bulkDeletePayments);
router.post('/bulk', protect, admin, bulkDeletePayments);
router.delete('/:id', protect, admin, deletePayment);

module.exports = router;
