import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerDetailModal from '../components/PlayerDetailModal';

const PlayerDetailPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();

  return (
    <PlayerDetailModal
      playerId={playerId}
      isOpen={true}
      onClose={() => navigate(-1)}
    />
  );
};

export default PlayerDetailPage;
