import { useState, useEffect, useContext } from 'react';
import { ChatContext } from '../contexts/ChatContext';
import api from '../services/api';
import { FiX, FiSearch, FiMessageSquare, FiUser, FiShield } from 'react-icons/fi';

const NewDirectMessageModal = ({ isOpen, onClose }) => {
  const { startDirectMessage } = useContext(ChatContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [eligibleUsers, setEligibleUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadEligibleDms();
    }
  }, [isOpen]);

  const loadEligibleDms = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/chat/eligible-dms');
      setEligibleUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch DM eligible users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (targetUserId) => {
    try {
      await startDirectMessage(targetUserId);
      onClose();
    } catch (err) {
      console.error('Error starting DM:', err);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = eligibleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.playerCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.team?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-5 shadow-2xl space-y-4">
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400 border border-cyan-500/20">
              <FiMessageSquare size={16} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-100">Start 1-on-1 Direct Message</h3>
              <p className="text-[10px] text-slate-400">Select a teammate, manager, or admin</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white">
            <FiX size={16} />
          </button>
        </div>

        {/* SEARCH BAR */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by player name or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />
          <FiSearch className="absolute left-3 top-2.5 text-slate-500" size={14} />
        </div>

        {/* USER LIST */}
        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {loading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading club members...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No matching members found</div>
          ) : (
            filteredUsers.map((u) => (
              <button
                key={u._id}
                onClick={() => handleSelectUser(u._id)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-900 bg-slate-900/60 p-2.5 text-left transition hover:border-cyan-500/30 hover:bg-slate-800"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 font-bold text-xs text-cyan-300 border border-slate-700">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      u.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-200 leading-tight">{u.name}</p>
                    <p className="text-[10px] text-slate-400">
                      {u.role === 'admin' ? (
                        <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                          <FiShield size={10} /> Club Admin
                        </span>
                      ) : (
                        <span>{u.position || u.role} {u.team?.name ? `• ${u.team.name}` : ''}</span>
                      )}
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-lg">
                  Chat
                </span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NewDirectMessageModal;
