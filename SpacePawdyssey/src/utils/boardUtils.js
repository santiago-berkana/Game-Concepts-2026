'use strict';

// ═══════════════════════════════════════════════════════════
//  PURE BOARD UTILITIES  (no Phaser dependency)
// ═══════════════════════════════════════════════════════════

/** Pixel position of the top-left corner of cell (r, c) */
function cellXY(r, c) {
  return { x: GRID_X + c * BLOCK_SIZE, y: GRID_Y + r * BLOCK_SIZE };
}

/** All distinct colour keys still present in the live grid */
function remainingColors(grid) {
  const s = new Set();
  grid.forEach(row => row?.forEach(cell => { if (cell) s.add(cell.key); }));
  return [...s];
}

/** True when every cell in the grid has been cleared */
function isEmpty(grid) {
  return grid.every(row => !row || row.every(cell => !cell));
}
