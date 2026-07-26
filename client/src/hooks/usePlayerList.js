import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';

/**
 * Shared custom hook for debounced search, position/team/tier filtering,
 * server-side pagination, URL query string sync, and loading skeletons.
 */
export const usePlayerList = ({ defaultLimit = 12 } = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial params from URL query string
  const initialSearch   = searchParams.get('search')   || '';
  const initialPosition = searchParams.get('position') || 'All';
  const initialTeam     = searchParams.get('team')     || 'All';
  const initialTier     = searchParams.get('tier')     || 'All';
  const initialPage     = parseInt(searchParams.get('page') || '1', 10);

  const [searchInput, setSearchInput]       = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [positionFilter, setPositionFilter]   = useState(initialPosition);
  const [teamFilter, setTeamFilter]         = useState(initialTeam);
  const [tierFilter, setTierFilter]         = useState(initialTier);
  const [page, setPage]                     = useState(initialPage);
  const [limit, setLimit]                   = useState(defaultLimit);

  const [players, setPlayers]       = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [loading, setLoading]       = useState(true);
  const [isFetching, setIsFetching] = useState(false);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync state to URL query params
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch)   params.set('search', debouncedSearch);
    if (positionFilter !== 'All') params.set('position', positionFilter);
    if (teamFilter !== 'All')     params.set('team', teamFilter);
    if (tierFilter !== 'All')     params.set('tier', tierFilter);
    if (page > 1)            params.set('page', String(page));

    setSearchParams(params, { replace: true });
  }, [debouncedSearch, positionFilter, teamFilter, tierFilter, page, setSearchParams]);

  // Reset to page 1 whenever filters or search query changes
  const prevFilterRef = useRef({ debouncedSearch, positionFilter, teamFilter, tierFilter });
  useEffect(() => {
    const prev = prevFilterRef.current;
    if (
      prev.debouncedSearch !== debouncedSearch ||
      prev.positionFilter !== positionFilter ||
      prev.teamFilter !== teamFilter ||
      prev.tierFilter !== tierFilter
    ) {
      setPage(1);
      prevFilterRef.current = { debouncedSearch, positionFilter, teamFilter, tierFilter };
    }
  }, [debouncedSearch, positionFilter, teamFilter, tierFilter]);

  // Fetch players from API
  const fetchPlayers = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await api.get('/users', {
        params: {
          page,
          limit,
          search: debouncedSearch,
          position: positionFilter,
          team: teamFilter,
          tier: tierFilter,
        },
      });

      if (res.data && Array.isArray(res.data.players)) {
        setPlayers(res.data.players);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
      } else if (Array.isArray(res.data)) {
        setPlayers(res.data);
        setTotalCount(res.data.length);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Failed to fetch player list:', err);
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [page, limit, debouncedSearch, positionFilter, teamFilter, tierFilter]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  const clearSearch = useCallback(() => {
    setSearchInput('');
    setDebouncedSearch('');
  }, []);

  return {
    players,
    totalCount,
    totalPages,
    currentPage: page,
    limit,
    setLimit,
    setPage,
    searchInput,
    setSearchInput,
    clearSearch,
    positionFilter,
    setPositionFilter,
    teamFilter,
    setTeamFilter,
    tierFilter,
    setTierFilter,
    loading,
    isFetching,
    refresh: fetchPlayers,
  };
};
