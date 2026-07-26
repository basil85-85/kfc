const Fixture = require('../models/Fixture');
const User = require('../models/User');
const League = require('../models/League');
const Session = require('../models/Session');
const Team = require('../models/Team');

/**
 * Handle AI KickBot intelligent queries with live DB context
 */
const askKickBot = async (req, res) => {
  const { question } = req.body;
  const user = req.user; // optional authenticated user

  if (!question || typeof question !== 'string') {
    return res.status(400).json({ message: 'Question string is required' });
  }

  const query = question.toLowerCase().trim();

  // Fetch live context in parallel for high intelligence responses
  const [upcomingFixture, topPlayers, activeSessions, teamsCount, leagues] = await Promise.all([
    Fixture.findOne({ status: 'scheduled' }).sort({ date: 1 }).populate('homeTeam awayTeam').lean(),
    User.find({ role: 'player' }).sort({ rating: -1, overallScore: -1 }).limit(3).populate('team').lean(),
    Session.find().sort({ date: 1 }).limit(3).lean(),
    Team.countDocuments(),
    League.find().lean()
  ]);

  let replyText = "";
  let actionLink = null;
  let liveContext = null;

  // 1. Fixtures & Next Match queries
  if (query.includes('fixture') || query.includes('match') || query.includes('schedule') || query.includes('next game') || query.includes('when')) {
    if (upcomingFixture) {
      const matchDate = new Date(upcomingFixture.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      const homeName = upcomingFixture.homeTeam?.name || 'KFC Home';
      const awayName = upcomingFixture.awayTeam?.name || 'Challengers';
      const location = upcomingFixture.location || 'KFC Home Pitch';
      const format = upcomingFixture.matchFormat || '11s';

      replyText = `Our next scheduled match is **${homeName} vs ${awayName}** (${format}) on 🗓️ **${matchDate}** at 📍 **${location}**! Want to view the full fixture list?`;
      liveContext = { type: 'fixture', data: upcomingFixture };
    } else {
      replyText = "There are no upcoming scheduled matches right now, but new fixtures are added regularly! Check out our full fixtures list:";
    }
    actionLink = { label: '🗓️ View Full Fixtures', path: '/fixtures' };

  // 2. Top Players, FIFA Stat Cards & Rankings
  } else if (query.includes('top player') || query.includes('best player') || query.includes('rating') || query.includes('fifa') || query.includes('card') || query.includes('stat')) {
    if (topPlayers && topPlayers.length > 0) {
      const topName = topPlayers[0].name;
      const topRating = topPlayers[0].rating || topPlayers[0].overallScore || 88;
      const topTeam = topPlayers[0].team?.name || 'KFC Squad';

      replyText = `Our top-rated player on the leaderboard is **${topName}** (${topTeam}) with a FIFA card rating of ⭐ **${topRating}**! Check out the complete squad roster and player stat cards:`;
      liveContext = { type: 'players', data: topPlayers };
    } else {
      replyText = "Our squad features player FIFA stat cards with ratings for pace, shooting, passing, dribbling, and defense!";
    }
    actionLink = { label: '👀 Explore Squad Cards', path: '/squad' };

  // 3. Standings & League Table
  } else if (query.includes('standing') || query.includes('table') || query.includes('rank') || query.includes('leaderboard') || query.includes('points')) {
    if (leagues && leagues.length > 0) {
      replyText = `We currently have **${leagues.length} active league phase(s)** running! Check out team points, goal differentials, and overall standings:`;
    } else {
      replyText = `There are **${teamsCount} teams** competing in KFC Football Club! You can inspect full team points and goal stats on the Standings page.`;
    }
    actionLink = { label: '🏆 View League Standings', path: '/standings' };

  // 4. Training Sessions & Attendance
  } else if (query.includes('session') || query.includes('train') || query.includes('practice') || query.includes('attend') || query.includes('fee')) {
    if (activeSessions && activeSessions.length > 0) {
      const nextSession = activeSessions[0];
      const sDate = new Date(nextSession.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      replyText = `Our next training session is on **${sDate}** (${nextSession.title || 'Team Drill'})! You can reserve your spot and confirm attendance right here:`;
      liveContext = { type: 'session', data: nextSession };
    } else {
      replyText = "KFC Football Club hosts weekly training sessions for fitness, tactical drills, and match practice!";
    }
    actionLink = { label: '📋 Browse Training Sessions', path: '/sessions' };

  // 5. Join, Register, Team Registration
  } else if (query.includes('join') || query.includes('sign up') || query.includes('register') || query.includes('team reg') || query.includes('account')) {
    if (user) {
      replyText = `Hi ${user.name}! You're already an official club member. You can register new teams, check payment receipts, or update your profile anytime!`;
      actionLink = { label: '👤 Go to Profile', path: '/dashboard/profile' };
    } else {
      replyText = `Joining KFC Football Club takes less than 30 seconds! We have **${teamsCount} active teams** and player slots open. Ready to create your account?`;
      actionLink = { label: '✨ Create Account Now', path: '/register' };
    }

  // 6. Match Formats (11s, 7s, 5s) & Tactics
  } else if (query.includes('format') || query.includes('11s') || query.includes('7s') || query.includes('5s') || query.includes('lineup') || query.includes('tactics')) {
    replyText = "KFC Football Club supports 3 official match formats: **11s** (full pitch, 11 players), **7s** (medium pitch, 7 players), and **5s** (fast-paced futsal, 5 players). Team managers can build custom formations on the Tactics Board!";
    actionLink = { label: '🛡️ Lineup Planner', path: '/dashboard/lineup-planner' };

  // 7. Admin & Support
  } else if (query.includes('admin') || query.includes('contact') || query.includes('support') || query.includes('help') || query.includes('manager')) {
    replyText = "Our club admins and team managers are always online in the real-time chat drawer! You can send them a direct message or check club notifications.";
    actionLink = { label: '💬 Open Real-Time Chat', action: 'openChat' };

  // 8. Greeting / Friendly Hello
  } else if (query.includes('hello') || query.includes('hi') || query.includes('hey') || query.includes('who are you') || query.includes('kickbot')) {
    const greetingName = user ? user.name.split(' ')[0] : 'friend';
    replyText = `Hey ${greetingName}! ⚽ I'm KickBot, your KFC Football Club guide! I can give you live updates on match schedules, top player ratings, session signups, or standings. What would you like to know?`;

  // 9. Default intelligent fallback with context
  } else {
    replyText = `I'm KickBot, your KFC Football Club assistant! We currently have **${teamsCount} teams** and live matchday data ready. Try asking about **"next match"**, **"top scorer"**, **"standings"**, or **"training sessions"**!`;
    actionLink = { label: '⚽ Check Fixtures', path: '/fixtures' };
  }

  res.json({
    success: true,
    replyText,
    actionLink,
    liveContext
  });
};

module.exports = {
  askKickBot
};
