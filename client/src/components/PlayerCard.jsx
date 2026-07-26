import FifaCard from './FifaCard';

const PlayerCard = ({ player }) => {
  return (
    <div className="crt-card group overflow-hidden p-6 transition hover:-translate-y-1">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 overflow-hidden rounded-3xl bg-slate-100">
          {player.photoURL ? <img src={player.photoURL} alt={player.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-slate-400">No photo</div>}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">{player.position || 'CM'}</p>
          <h3 className="text-xl font-semibold text-slate-900">{player.name}</h3>
          <p className="text-sm text-slate-500">#{player.jersey || '00'}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-sm text-slate-600">
        <div><span className="font-semibold text-slate-900">PAC:</span> {player.pace || '–'}</div>
        <div><span className="font-semibold text-slate-900">SHO:</span> {player.shooting || '–'}</div>
        <div><span className="font-semibold text-slate-900">PAS:</span> {player.passing || '–'}</div>
        <div><span className="font-semibold text-slate-900">DRI:</span> {player.dribbling || '–'}</div>
        <div><span className="font-semibold text-slate-900">DEF:</span> {player.defending || '–'}</div>
        <div><span className="font-semibold text-slate-900">PHY:</span> {player.physical || '–'}</div>
      </div>
      {player.overall && <div className="mt-4 text-right text-sm uppercase text-slate-500">Overall {player.overall}</div>}
    </div>
  );
};

export default PlayerCard;
