import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import { AuthContext } from '../contexts/AuthContext';
import api from '../services/api';
import { FiPlus, FiUsers, FiX, FiCheck, FiUserPlus, FiUserMinus } from 'react-icons/fi';

const ChatRoomManager = () => {
  const { user } = useContext(AuthContext);
  const { rooms, createRoom, updateRoomMembers } = useContext(ChatContext);

  const [isCreating, setIsCreating] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState([]);
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [searchFilter, setSearchFilter] = useState('');

  const [editingRoomId, setEditingRoomId] = useState(null);
  const [addMemberIds, setAddMemberIds] = useState([]);
  const [removeMemberIds, setRemoveMemberIds] = useState([]);

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isCreating || editingRoomId) {
      loadEligibleUsers();
    }
  }, [isCreating, editingRoomId]);

  const loadEligibleUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/chat/eligible-members');
      setEligibleUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load eligible members:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!roomName.trim()) return;
    try {
      await createRoom(roomName.trim(), selectedMemberIds);
      setRoomName('');
      setSelectedMemberIds([]);
      setIsCreating(false);
    } catch {
      /* handled in context toast */
    }
  };

  const handleUpdateMembersSubmit = async (roomId) => {
    try {
      await updateRoomMembers(roomId, addMemberIds, removeMemberIds);
      setEditingRoomId(null);
      setAddMemberIds([]);
      setRemoveMemberIds([]);
    } catch {
      /* handled in context toast */
    }
  };

  const toggleSelectMember = (userId) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const filteredEligible = eligibleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.playerCode?.toLowerCase().includes(searchFilter.toLowerCase())
  );

  const customRooms = rooms.filter((r) => r.type === 'custom');

  return (
    <div className="border-b border-slate-800 bg-slate-900/80 p-3">
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-cyan-400">
          <FiUsers /> Room Management
        </h4>
        <button
          onClick={() => setIsCreating((prev) => !prev)}
          className="flex items-center gap-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 transition hover:bg-cyan-500/20"
        >
          <FiPlus /> New Room
        </button>
      </div>

      {/* CREATE ROOM FORM */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} className="mt-3 rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">Create Custom Room</span>
            <button type="button" onClick={() => setIsCreating(false)} className="text-slate-400 hover:text-white">
              <FiX />
            </button>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Room Name</label>
            <input
              type="text"
              placeholder="e.g. Match Day Squad, Coaching Staff"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
              Select Members ({selectedMemberIds.length} selected)
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full mb-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 text-[11px] text-slate-300"
            />
            <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1.5">
              {filteredEligible.map((u) => {
                const selected = selectedMemberIds.includes(u._id);
                return (
                  <button
                    key={u._id}
                    type="button"
                    onClick={() => toggleSelectMember(u._id)}
                    className={`flex w-full items-center justify-between rounded-md px-2 py-1 text-[11px] transition ${
                      selected ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/30' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>
                      {u.name} <span className="text-[10px] text-slate-500">({u.role}{u.team?.name ? ` • ${u.team.name}` : ''})</span>
                    </span>
                    {selected && <FiCheck className="text-cyan-400" />}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-cyan-500 py-1.5 font-bold text-slate-950 hover:bg-cyan-400 transition"
          >
            Create Room
          </button>
        </form>
      )}

      {/* MANAGING CUSTOM ROOMS */}
      {customRooms.length > 0 && !isCreating && (
        <div className="mt-2 space-y-1.5">
          {customRooms.map((r) => (
            <div key={r._id} className="rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200">{r.name}</span>
                  <span className="ml-2 text-[10px] text-slate-500">({r.members?.length || 0} members)</span>
                </div>
                {(user.role === 'admin' || r.createdBy?._id === user._id) && (
                  <button
                    onClick={() => setEditingRoomId(editingRoomId === r._id ? null : r._id)}
                    className="text-[10px] font-semibold text-cyan-400 hover:underline"
                  >
                    {editingRoomId === r._id ? 'Cancel' : 'Manage'}
                  </button>
                )}
              </div>

              {editingRoomId === r._id && (
                <div className="mt-2 pt-2 border-t border-slate-800 space-y-2">
                  <div className="text-[10px] font-bold text-slate-400">Current Members:</div>
                  <div className="flex flex-wrap gap-1">
                    {r.members?.map((m) => (
                      <span key={m._id} className="flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {m.name}
                        <button
                          type="button"
                          onClick={() =>
                            setRemoveMemberIds((prev) =>
                              prev.includes(m._id) ? prev.filter((id) => id !== m._id) : [...prev, m._id]
                            )
                          }
                          className={removeMemberIds.includes(m._id) ? 'text-rose-500 font-bold' : 'text-slate-500 hover:text-rose-400'}
                        >
                          <FiUserMinus />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="text-[10px] font-bold text-slate-400 mt-2">Add New Members:</div>
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {eligibleUsers
                      .filter((u) => !r.members?.some((m) => m._id === u._id))
                      .map((u) => (
                        <button
                          key={u._id}
                          type="button"
                          onClick={() =>
                            setAddMemberIds((prev) =>
                              prev.includes(u._id) ? prev.filter((id) => id !== u._id) : [...prev, u._id]
                            )
                          }
                          className={`flex w-full items-center justify-between px-2 py-0.5 text-[10px] rounded ${
                            addMemberIds.includes(u._id) ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span>{u.name}</span>
                          {addMemberIds.includes(u._id) && <FiUserPlus className="text-emerald-400" />}
                        </button>
                      ))}
                  </div>

                  <button
                    onClick={() => handleUpdateMembersSubmit(r._id)}
                    className="w-full mt-2 rounded bg-cyan-600 py-1 text-[11px] font-bold text-white hover:bg-cyan-500"
                  >
                    Save Member Changes
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoomManager;
