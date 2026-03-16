'use strict';

// ═══════════════════════════════════════════════════════════
//  LEVEL DEFINITIONS
// ═══════════════════════════════════════════════════════════
const LEVELS = [
  {
    title: 'LEVEL 1',
    shots: 10,
    walls: { left: ['r', 'b'], right: ['g', 'y'], top: ['p', 'c'] },
    grid: [
      'rrrppccggg',
      'rrrppccggg',
      'bbbppccyyy',
      'bbbppccyyy',
      'rrrppccggg',
    ],
  },
  {
    title: 'LEVEL 2',
    shots: 14,
    walls: { left: ['b', 'c'], right: ['r', 'g'], top: ['y', 'p'] },
    grid: [
      'bbbyypprrr',
      'bbbyypprrr',
      'bbbyypprrr',
      'cccyyppggg',
      'cccyyppggg',
      'bbbyypprrr',
    ],
  },
  {
    title: 'LEVEL 3',
    shots: 19,
    walls: { left: ['r', 'g', 'b'], right: ['y', 'p', 'c'], top: ['b', 'c'] },
    grid: [
      'rrrbbccyyy',
      'rrrbbccyyy',
      'rrrbbccyyy',
      'gggbbccppp',
      'gggbbccppp',
      'gggbbccppp',
      'bbbbbccccc',
    ],
  },
];
