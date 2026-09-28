import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import type { Board, Cell } from './types.js';
import {
  analysis,
  boardStore,
  runAnalysis,
  toggleCell
} from './stores/boardStore.js';

/**
 * 构造 4×3 的 2×2 白格块（与 solver.test.ts 相同的合法唯一解盘面）。
 *  H=[3,4], V=[3,4] => 唯一解 [2,1,1,3]。
 */
function uniqueBoard(): Board {
  const walls = Array.from({ length: 12 }, () => ({
    type: 'wall' as const,
    h: null as number | null,
    v: null as number | null
  }));
  walls[1].v = 3; // W(0,1)
  walls[2].v = 4; // W(0,2)
  walls[3].h = 3; // W(1,0)
  walls[6].h = 4; // W(2,0)
  const cells: Cell[] = walls;
  for (const i of [4, 5, 7, 8]) cells[i] = { type: 'white' };
  return { rows: 4, cols: 3, cells };
}

describe('分析版本管理', () => {
  it('分析期间修改棋盘：旧搜索结果不得覆盖新盘面，且旧结论保持失效标记', async () => {
    boardStore.set(uniqueBoard());
    const run = runAnalysis();
    // 求解尚未落定（setTimeout 让出一帧）即改动盘面。
    toggleCell(4);
    await run;

    const state = get(analysis);
    expect(state.stale).toBe(true);
    expect(state.result).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('不被打断的分析正常产出：状态 done、结论有效', async () => {
    boardStore.set(uniqueBoard());
    await runAnalysis();
    const state = get(analysis);
    expect(state.stale).toBe(false);
    expect(state.status).toBe('done');
    expect(state.result?.status).toBe('unique');
  });
});
