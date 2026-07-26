const MATCH_FORMAT_CONFIG = {
  '5s': {
    code: '5s',
    label: '5-a-side',
    startingCount: 5,
    maxSubs: 5,
    formations: ['1-2-1', '2-1-1'],
  },
  '7s': {
    code: '7s',
    label: '7-a-side',
    startingCount: 7,
    maxSubs: 5,
    formations: ['2-3-1', '3-2-1'],
  },
  '11s': {
    code: '11s',
    label: '11-a-side',
    startingCount: 11,
    maxSubs: 7,
    formations: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'],
  },
};

const getMatchFormatConfig = (format) => {
  const key = (format || '11s').toLowerCase();
  return MATCH_FORMAT_CONFIG[key] || MATCH_FORMAT_CONFIG['11s'];
};

module.exports = {
  MATCH_FORMAT_CONFIG,
  getMatchFormatConfig,
};
