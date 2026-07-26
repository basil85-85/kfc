import { useParams, useNavigate } from 'react-router-dom';
import FixtureDetailModal from '../components/FixtureDetailModal';

const FixtureDetailPage = () => {
  const { fixtureId } = useParams();
  const navigate = useNavigate();

  return (
    <FixtureDetailModal
      fixtureId={fixtureId}
      isOpen={true}
      onClose={() => navigate(-1)}
    />
  );
};

export default FixtureDetailPage;
