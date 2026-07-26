export const MATCH_FORMAT_CONFIG = {
  '5s': {
    code: '5s',
    label: '5-a-side',
    badgeLabel: '5s',
    startingCount: 5,
    maxSubs: 5,
    formations: ['1-2-1', '2-1-1'],
    formationSlots: {
      '1-2-1': [
        { id: 'GK',  label: 'GK',  x: 50, y: 88 },
        { id: 'DF1', label: 'CB',  x: 50, y: 68 },
        { id: 'MF1', label: 'LM',  x: 20, y: 44 },
        { id: 'MF2', label: 'RM',  x: 80, y: 44 },
        { id: 'ST',  label: 'ST',  x: 50, y: 22 },
      ],
      '2-1-1': [
        { id: 'GK',  label: 'GK',  x: 50, y: 88 },
        { id: 'DF1', label: 'LB',  x: 25, y: 68 },
        { id: 'DF2', label: 'RB',  x: 75, y: 68 },
        { id: 'MF1', label: 'CM',  x: 50, y: 46 },
        { id: 'ST',  label: 'ST',  x: 50, y: 22 },
      ],
    },
  },
  '7s': {
    code: '7s',
    label: '7-a-side',
    badgeLabel: '7s',
    startingCount: 7,
    maxSubs: 5,
    formations: ['2-3-1', '3-2-1'],
    formationSlots: {
      '2-3-1': [
        { id: 'GK',  label: 'GK',  x: 50, y: 88 },
        { id: 'DF1', label: 'LB',  x: 24, y: 72 },
        { id: 'DF2', label: 'RB',  x: 76, y: 72 },
        { id: 'MF1', label: 'LM',  x: 18, y: 46 },
        { id: 'MF2', label: 'CM',  x: 50, y: 48 },
        { id: 'MF3', label: 'RM',  x: 82, y: 46 },
        { id: 'ST',  label: 'ST',  x: 50, y: 22 },
      ],
      '3-2-1': [
        { id: 'GK',  label: 'GK',  x: 50, y: 88 },
        { id: 'DF1', label: 'LB',  x: 20, y: 72 },
        { id: 'DF2', label: 'CB',  x: 50, y: 74 },
        { id: 'DF3', label: 'RB',  x: 80, y: 72 },
        { id: 'MF1', label: 'LCM', x: 32, y: 46 },
        { id: 'MF2', label: 'RCM', x: 68, y: 46 },
        { id: 'ST',  label: 'ST',  x: 50, y: 22 },
      ],
    },
  },
  '11s': {
    code: '11s',
    label: '11-a-side',
    badgeLabel: '11s',
    startingCount: 11,
    maxSubs: 7,
    formations: ['4-4-2', '4-3-3', '3-5-2', '4-2-3-1'],
  },
};

export const getMatchFormatConfig = (format) => {
  const key = (format || '11s').toLowerCase();
  return MATCH_FORMAT_CONFIG[key] || MATCH_FORMAT_CONFIG['11s'];
};
