import { Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './routes/ProtectedRoute';
import AdminRoute from './routes/AdminRoute';
import HomePage from './pages/HomePage';
import SquadPage from './pages/SquadPage';
import FixturesPage from './pages/FixturesPage';
import StandingsPage from './pages/StandingsPage';
import TeamRosterPage from './pages/TeamRosterPage';
import LeaderboardPage from './pages/LeaderboardPage';
import GalleryPage from './pages/GalleryPage';
import LoginPage from './pages/LoginPage';
import RegisterChoicePage from './pages/RegisterChoicePage';
import RegisterPage from './pages/RegisterPage';
import RegisterTeamSignupPage from './pages/RegisterTeamSignupPage';
import RegisterTeamPage from './pages/RegisterTeamPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import AdminLoginPage from './pages/AdminLoginPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import MyPaymentsPage from './pages/MyPaymentsPage';
import SessionsPage from './pages/SessionsPage';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminThemePage from './pages/AdminThemePage';
import AdminPlayersPage from './pages/AdminPlayersPage';
import AdminRatingsPage from './pages/AdminRatingsPage';
import AdminSessionsPage from './pages/AdminSessionsPage';
import AdminLeaguesPage from './pages/AdminLeaguesPage';
import AdminFixturesPage from './pages/AdminFixturesPage';
import AdminLineupPage from './pages/AdminLineupPage';
import AdminPaymentsPage from './pages/AdminPaymentsPage';
import AdminNotificationsPage from './pages/AdminNotificationsPage';
import AdminGalleryPage from './pages/AdminGalleryPage';
import AdminTeamsPage from './pages/AdminTeamsPage';
import AdminPendingTeamsPage from './pages/AdminPendingTeamsPage';
import NotFoundPage from './pages/NotFoundPage';
import PlayerDetailPage from './pages/PlayerDetailPage';
import LineupPlannerPage from './pages/LineupPlannerPage';
import FixtureDetailPage from './pages/FixtureDetailPage';

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="squad" element={<SquadPage />} />
        <Route path="fixtures" element={<FixturesPage />} />
        <Route path="fixtures/:fixtureId" element={<FixtureDetailPage />} />
        <Route path="players/:playerId" element={<PlayerDetailPage />} />
        <Route path="standings" element={<StandingsPage />} />
        <Route path="teams/:teamId" element={<TeamRosterPage />} />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route path="gallery" element={<GalleryPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="verify-email" element={<VerifyEmailPage />} />
        <Route path="register" element={<RegisterChoicePage />} />
        <Route path="register/player" element={<RegisterPage />} />
        <Route path="register/team" element={<RegisterTeamSignupPage />} />

        <Route path="admin/login" element={<AdminLoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dashboard/profile" element={<ProfilePage />} />
          <Route path="dashboard/my-payments" element={<MyPaymentsPage />} />
          <Route path="dashboard/sessions" element={<SessionsPage />} />
          <Route path="dashboard/notifications" element={<NotificationsPage />} />
          <Route path="dashboard/register-team" element={<RegisterTeamPage />} />
          <Route path="dashboard/lineup-planner" element={<LineupPlannerPage />} />
        </Route>
        <Route path="admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="theme" element={<AdminThemePage />} />
            <Route path="players" element={<AdminPlayersPage />} />
            <Route path="ratings" element={<AdminRatingsPage />} />
            <Route path="sessions" element={<AdminSessionsPage />} />
            <Route path="teams" element={<AdminTeamsPage />} />
            <Route path="team-requests" element={<AdminPendingTeamsPage />} />
            <Route path="leagues" element={<AdminLeaguesPage />} />
            <Route path="fixtures" element={<AdminFixturesPage />} />
            <Route path="lineup" element={<AdminLineupPage />} />
            <Route path="payments" element={<AdminPaymentsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="gallery" element={<AdminGalleryPage />} />
          </Route>
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default App;
