import { useState, useMemo, useCallback } from 'react';

/**
 * Reusable bulk selection hook for admin tables (Payments, Players, Fixtures, etc.)
 *
 * @param {Array} items - Array of visible/filtered items currently rendered in table
 * @param {String} idKey - Field name for primary key (defaults to '_id')
 */
export const useBulkSelect = (items = [], idKey = '_id') => {
  const [selectedIds, setSelectedIds] = useState([]);

  // Get array of string IDs for currently visible/filtered items only
  const visibleIds = useMemo(
    () => items.map((item) => String(item[idKey])).filter(Boolean),
    [items, idKey]
  );

  // Are ALL currently visible items selected?
  const isAllSelected = useMemo(() => {
    if (visibleIds.length === 0) return false;
    return visibleIds.every((id) => selectedIds.includes(id));
  }, [visibleIds, selectedIds]);

  // Are SOME (but not all) currently visible items selected?
  const isSomeSelected = useMemo(() => {
    return visibleIds.some((id) => selectedIds.includes(id)) && !isAllSelected;
  }, [visibleIds, selectedIds, isAllSelected]);

  // Toggle select-all for currently visible items
  const toggleSelectAll = useCallback(() => {
    if (isAllSelected) {
      // Deselect only currently visible items
      setSelectedIds((prev) => prev.filter((id) => !visibleIds.includes(id)));
    } else {
      // Select all currently visible items (preserving any existing selections)
      setSelectedIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
    }
  }, [isAllSelected, visibleIds]);

  // Toggle single item selection
  const toggleSelectItem = useCallback((id) => {
    const idStr = String(id);
    setSelectedIds((prev) =>
      prev.includes(idStr) ? prev.filter((item) => item !== idStr) : [...prev, idStr]
    );
  }, []);

  // Check if a specific ID is selected
  const isSelected = useCallback(
    (id) => selectedIds.includes(String(id)),
    [selectedIds]
  );

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  return {
    selectedIds,
    setSelectedIds,
    isAllSelected,
    isSomeSelected,
    toggleSelectAll,
    toggleSelectItem,
    isSelected,
    clearSelection,
    selectedCount: selectedIds.length,
  };
};

export default useBulkSelect;
