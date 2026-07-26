const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Team = require('../models/Team');
const generateToken = require('../utils/token');
const { parseHighlightVideo } = require('../utils/videoHelper');
const { sendTeamRegistrationConfirmation, sendVerificationOTP } = require('../utils/emailService');
const { generateUniquePlayerCode } = require('../utils/playerCodeGenerator');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const register = async (req, res) => {
  const { name, email, password, phone, position, jersey, photoURL, highlightVideoUrl, aboutMe } = req.body;

  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email, and password are required');
  }

  const cleanEmail = email.toLowerCase().trim();
  const existingUser = await User.findOne({ email: cleanEmail });

  if (existingUser) {
    if (!existingUser.isVerified) {
      // If user registered previously but never verified, resend code and prompt verification
      const code = generateOTP();
      existingUser.verificationCode = code;
      existingUser.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      existingUser.lastVerificationSentAt = new Date();
      existingUser.failedVerificationAttempts = 0;
      existingUser.verificationLockoutUntil = null;
      await existingUser.save();

      await sendVerificationOTP({ email: cleanEmail, name: existingUser.name, code });

      return res.status(200).json({
        requireVerification: true,
        email: cleanEmail,
        message: 'Account exists but is unverified. A new verification code has been sent to your email.',
      });
    }

    res.status(400);
    throw new Error('Email already registered. Please log in instead.');
  }

  let videoData = { raw: '', embed: '' };
  if (highlightVideoUrl) {
    videoData = parseHighlightVideo(highlightVideoUrl);
  }

  if (aboutMe && aboutMe.length > 300) {
    res.status(400);
    throw new Error('About Me bio cannot exceed 300 characters');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const playerCode = await generateUniquePlayerCode();

  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    phone,
    position,
    jersey,
    photoURL,
    highlightVideoUrl: videoData.raw,
    highlightVideoEmbed: videoData.embed,
    aboutMe: aboutMe ? aboutMe.trim() : '',
    isVerified: true,
    playerCode,
    joinedAt: new Date(),
  });

  // Send optional welcome email asynchronously (does not block registration)
  sendVerificationOTP({ email: cleanEmail, name: user.name, code: playerCode }).catch((e) => console.error(e));

  const populatedUser = await User.findById(user._id).select('-password').populate('team', 'name logo color status managerEmail');

  res.status(201).json({
    ...populatedUser.toObject(),
    token: generateToken(user._id),
  });
};



const verifyEmail = async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    res.status(400);
    throw new Error('Email and verification code are required');
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail }).populate('team', 'name logo color status managerEmail');

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (user.isVerified) {
    if (!user.playerCode && user.role === 'player') {
      user.playerCode = await generateUniquePlayerCode();
      await user.save();
    }
    const userObj = user.toObject();
    delete userObj.password;
    return res.json({
      ...userObj,
      token: generateToken(user._id),
      message: 'Email is already verified.',
    });
  }

  // Lockout check
  if (user.verificationLockoutUntil && user.verificationLockoutUntil > new Date()) {
    const remainingMins = Math.ceil((user.verificationLockoutUntil - new Date()) / 60000);
    res.status(429);
    throw new Error(`Too many failed attempts. Verification is locked for ${remainingMins} minute(s). Click "Resend Code" below to reset and get a new code.`);
  }

  // Expiration check
  if (!user.verificationCodeExpires || user.verificationCodeExpires < new Date()) {
    res.status(400);
    throw new Error('Verification code has expired. Please click "Resend Code" to get a fresh 6-digit code.');
  }

  // Code verification
  if (user.verificationCode !== String(code).trim()) {
    user.failedVerificationAttempts = (user.failedVerificationAttempts || 0) + 1;
    if (user.failedVerificationAttempts >= 5) {
      user.verificationLockoutUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 min lockout
    }
    await user.save();

    if (user.failedVerificationAttempts >= 5) {
      res.status(429);
      throw new Error('Too many failed verification attempts (5/5). Account locked for 5 minutes. Click "Resend Code" to reset.');
    }

    const attemptsRemaining = 5 - user.failedVerificationAttempts;
    res.status(400);
    throw new Error(`Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`);
  }


  // Success! Generate Unique Player Code
  let playerCode = user.playerCode;
  if (!playerCode) {
    playerCode = await generateUniquePlayerCode();
  }

  user.isVerified = true;
  user.playerCode = playerCode;
  user.verificationCode = '';
  user.verificationCodeExpires = null;
  user.failedVerificationAttempts = 0;
  user.verificationLockoutUntil = null;
  await user.save();

  const populatedUser = await User.findById(user._id).select('-password').populate('team', 'name logo color status managerEmail');

  const userObj = populatedUser.toObject();

  res.json({
    ...userObj,
    token: generateToken(user._id),
    message: 'Email verified successfully! Welcome to KFC.',
  });
};

const resendVerificationCode = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    res.status(400);
    throw new Error('Email address is required');
  }

  const cleanEmail = String(email).toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail });

  if (!user) {
    res.status(404);
    throw new Error('No account found with this email address.');
  }

  if (user.isVerified) {
    res.status(400);
    throw new Error('Your email is already verified. You can log in directly.');
  }

  // Rate limiting: 10s cooldown in dev mode, 60s in production
  const cooldownSecs = process.env.NODE_ENV === 'production' ? 60 : 10;
  if (user.lastVerificationSentAt && Date.now() - user.lastVerificationSentAt.getTime() < cooldownSecs * 1000) {
    const waitSecs = Math.ceil((cooldownSecs * 1000 - (Date.now() - user.lastVerificationSentAt.getTime())) / 1000);
    res.status(429);
    throw new Error(`Please wait ${waitSecs} second(s) before requesting another code.`);
  }


  const newCode = generateOTP();
  user.verificationCode = newCode;
  user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
  user.lastVerificationSentAt = new Date();
  user.failedVerificationAttempts = 0;
  user.verificationLockoutUntil = null;
  await user.save();

  const emailRes = await sendVerificationOTP({ email: cleanEmail, name: user.name, code: newCode });
  console.log(`\n🔑 [OTP RESENT] Email: ${cleanEmail} | Code: ${newCode}\n`);

  if (emailRes && emailRes.success === false) {
    res.status(500);
    throw new Error(`We couldn't send your verification email (${emailRes.error || 'SMTP delivery failed'}). Please try again.`);
  }

  const isDev = process.env.NODE_ENV !== 'production';

  res.json({
    success: true,
    message: 'A new 6-digit verification code has been sent to your email address.',
    devOtp: isDev ? newCode : undefined,
  });
};



const registerManager = async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    teamName,
    color,
    logo,
    country,
    description,
  } = req.body;

  if (!name || !email || !password || !teamName) {
    res.status(400);
    throw new Error('Name, email, password, and team name are required to register as a manager');
  }

  const cleanEmail = String(email).trim().toLowerCase();

  const existingUser = await User.findOne({ email: cleanEmail });
  if (existingUser) {
    res.status(400);
    throw new Error('A user with this email already exists. Use a different manager email to register a new team.');
  }

  const existingTeamWithEmail = await Team.findOne({
    managerEmail: cleanEmail,
    status: { $in: ['pending', 'approved'] },
  });

  if (existingTeamWithEmail) {
    res.status(400);
    throw new Error('This manager email already has a pending or approved team registration');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    name: name.trim(),
    email: cleanEmail,
    password: hashedPassword,
    phone,
    role: 'manager',
    isVerified: true, // Managers verified via team review or auto-verified on creation
    photoURL: logo || '',
    joinedAt: new Date(),
  });

  const team = await Team.create({
    name: teamName.trim(),
    color: color || '#00d2ff',
    logo: logo || '',
    country: country ? country.trim() : '',
    managerName: name.trim(),
    managerEmail: cleanEmail,
    description: description ? description.trim() : '',
    status: 'pending',
    createdBy: user._id,
  });

  await User.findByIdAndUpdate(user._id, { team: team._id });

  await sendTeamRegistrationConfirmation({
    managerEmail: cleanEmail,
    managerName: name.trim(),
    teamName: team.name,
    logo: team.logo,
    color: team.color,
  });

  const populatedUser = await User.findById(user._id)
    .select('-password')
    .populate('team', 'name logo color status managerEmail');

  res.status(201).json({
    ...populatedUser.toObject(),
    token: generateToken(user._id),
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = String(email || '').toLowerCase().trim();
  const user = await User.findOne({ email: cleanEmail }).populate('team', 'name logo color status managerEmail');

  if (user && (await bcrypt.compare(password, user.password))) {
    let needsSave = false;

    if (user.isVerified === false) {
      user.isVerified = true;
      needsSave = true;
    }

    if (!user.playerCode && user.role === 'player') {
      user.playerCode = await generateUniquePlayerCode();
      needsSave = true;
    }

    if (needsSave) {
      await user.save();
    }

    const userObj = user.toObject();

    delete userObj.password;
    res.json({
      ...userObj,
      token: generateToken(user._id),
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
};

const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password').populate('team', 'name logo color status managerEmail');
  res.json(user);
};

module.exports = { register, verifyEmail, resendVerificationCode, registerManager, login, getMe };

