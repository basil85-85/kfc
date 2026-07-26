const ChatMessage = require('../models/ChatMessage');

const startChatCleanupJob = () => {
  const runCleanup = async () => {
    try {
      const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const result = await ChatMessage.deleteMany({ sentAt: { $lt: cutoff } });
      if (result.deletedCount > 0) {
        console.log(`🧹 [Chat Cleanup] Deleted ${result.deletedCount} messages older than 90 days`);
      }
    } catch (err) {
      console.error('❌ [Chat Cleanup] Job failed:', err);
    }
  };

  runCleanup();
  // Run once daily
  setInterval(runCleanup, 24 * 60 * 60 * 1000);
};

module.exports = { startChatCleanupJob };
