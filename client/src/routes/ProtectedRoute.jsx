import { useContext } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import UnauthenticatedPromptCard from '../components/UnauthenticatedPromptCard';

const ProtectedRoute = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  if (!user) {
    let title = "Sign in to access your dashboard";
    let subtitle = "Log in with your KFC account to access player tools, team portals, and match data.";
    let icon = "lock";

    const path = location.pathname;

    if (path.includes('/lineup-planner')) {
      title = "Sign in to plan team lineups";
      subtitle = "Access tactical formations, player position slotting, and team lineup management.";
      icon = "shield";
    } else if (path.includes('/my-payments')) {
      title = "Sign in to view payment history";
      subtitle = "Track session fees, squad dues, and official transaction receipts.";
      icon = "shield";
    } else if (path.includes('/sessions')) {
      title = "Sign in to register for training sessions";
      subtitle = "Book training slots, confirm matchday attendance, and track team drills.";
      icon = "lock";
    } else if (path.includes('/notifications')) {
      title = "Sign in to view your notifications";
      subtitle = "Stay updated on urgent club announcements, fixture changes, and roster updates.";
      icon = "chat";
    } else if (path.includes('/profile')) {
      title = "Sign in to access your profile";
      subtitle = "Manage your FIFA player stat card, personal details, and squad preferences.";
      icon = "lock";
    }

    return (
      <UnauthenticatedPromptCard
        title={title}
        subtitle={subtitle}
        icon={icon}
      />
    );
  }

  return <Outlet />;
};

export default ProtectedRoute;
