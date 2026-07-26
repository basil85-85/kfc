// KFC Express Server + Socket.io Real-Time Engine (DM & SMS Enabled)
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('express-async-errors');

const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const seedAdmin = require('./utils/seedAdmin');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ratingRoutes = require('./routes/ratingRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const leagueRoutes = require('./routes/leagueRoutes');
const teamRoutes = require('./routes/teamRoutes');
const fixtureRoutes = require('./routes/fixtureRoutes');
const lineupRoutes = require('./routes/lineupRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const galleryRoutes = require('./routes/galleryRoutes');
const themeRoutes = require('./routes/themeRoutes');
const chatRoutes = require('./routes/chatRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: true,
    credentials: true,
  },
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

const mongoose = require('mongoose');

app.get('/api/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const dbStatusMap = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    status: 'OK',
    mongodb: dbStatusMap[dbState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/leagues', leagueRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/fixtures', fixtureRoutes);
app.use('/api/lineups', lineupRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/theme', themeRoutes);
app.use('/api/chat', chatRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const fixUnassignedTeams = require('./utils/fixUnassignedTeams');
const { verifyTransporter } = require('./utils/emailService');
const { initSocketServer } = require('./socket/socketServer');
const { ensureBroadcastRoom } = require('./utils/chatRoomUtils');
const { startChatCleanupJob } = require('./utils/chatCleanup');

const start = async () => {
  await connectDB();
  await seedAdmin();
  await fixUnassignedTeams();
  await verifyTransporter();
  await ensureBroadcastRoom();
  startChatCleanupJob();

  initSocketServer(io);

  httpServer.listen(PORT, () => {
    console.log(`Server & Socket.io running on port ${PORT}`);
  });
};

start();
