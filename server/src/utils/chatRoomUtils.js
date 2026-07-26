const ChatRoom = require('../models/ChatRoom');
const Team = require('../models/Team');
const User = require('../models/User');

const ensureBroadcastRoom = async () => {
  try {
    let room = await ChatRoom.findOne({ type: 'broadcast' });
    if (!room) {
      room = await ChatRoom.create({
        name: 'Club Broadcast',
        type: 'broadcast',
        members: [],
        videoRoomName: 'kfc-club-broadcast-room',
      });
      console.log('✅ [Chat] Broadcast room initialized');
    } else if (!room.videoRoomName) {
      room.videoRoomName = 'kfc-club-broadcast-room';
      await room.save();
    }
    return room;
  } catch (err) {
    console.error('❌ [Chat] Error initializing broadcast room:', err);
  }
};

const ensureTeamChatRoom = async (teamId, createdBy = null) => {
  try {
    const team = await Team.findById(teamId);
    if (!team) return null;

    let room = await ChatRoom.findOne({ type: 'team', teamId: team._id });

    // Fetch all active players for this team + manager
    const teamPlayers = await User.find({ team: team._id, active: true }).select('_id');
    let memberIds = teamPlayers.map((u) => u._id);

    if (team.createdBy && !memberIds.some((id) => id.toString() === team.createdBy.toString())) {
      memberIds.push(team.createdBy);
    }

    const videoName = `kfc-team-room-${team._id}`;

    if (!room) {
      room = await ChatRoom.create({
        name: `${team.name} Team Chat`,
        type: 'team',
        teamId: team._id,
        members: memberIds,
        createdBy: createdBy || team.createdBy,
        videoRoomName: videoName,
      });
      console.log(`✅ [Chat] Team chat room created for team "${team.name}"`);
    } else {
      // Sync members & videoRoomName
      room.members = memberIds;
      room.name = `${team.name} Team Chat`;
      if (!room.videoRoomName) {
        room.videoRoomName = videoName;
      }
      await room.save();
    }
    return room;
  } catch (err) {
    console.error(`❌ [Chat] Error ensuring team chat room for team ${teamId}:`, err);
  }
};

const addUserToTeamRoom = async (userId, teamId) => {
  try {
    const room = await ChatRoom.findOne({ type: 'team', teamId });
    if (room) {
      await ChatRoom.findByIdAndUpdate(room._id, { $addToSet: { members: userId } });
    }
  } catch (err) {
    console.error('❌ [Chat] Error adding user to team room:', err);
  }
};

const removeUserFromTeamRoom = async (userId, teamId) => {
  try {
    const room = await ChatRoom.findOne({ type: 'team', teamId });
    if (room) {
      await ChatRoom.findByIdAndUpdate(room._id, { $pull: { members: userId } });
    }
  } catch (err) {
    console.error('❌ [Chat] Error removing user from team room:', err);
  }
};

module.exports = {
  ensureBroadcastRoom,
  ensureTeamChatRoom,
  addUserToTeamRoom,
  removeUserFromTeamRoom,
};
