const Loading = ({ message = 'Loading KFC portal...' }) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-3xl border border-white/[0.06] bg-slate-950/80 p-12 text-center backdrop-blur-xl">
      <div className="relative mb-6 flex items-center justify-center">
        {/* Outer Glow Ring */}
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-400 shadow-glow-cyan" />
        {/* Inner Counter Pulse */}
        <div className="absolute h-8 w-8 animate-ping rounded-full bg-teal-400/20" />
        <div className="absolute h-4 w-4 rounded-full bg-cyan-400 shadow-glow-cyan" />
      </div>
      <p className="font-display text-sm font-semibold tracking-wider uppercase text-cyan-300 animate-pulse">
        {message}
      </p>
    </div>
  );
};

export default Loading;
