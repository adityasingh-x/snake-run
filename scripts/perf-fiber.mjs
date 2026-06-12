import { chromium } from 'playwright';

const URL = 'http://localhost:5173/snake-run/';

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1024, height: 768 } });
const page = await ctx.newPage();

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);

await page.getByRole('button', { name: /runner mode/i }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /^start$/i }).click();
await page.waitForTimeout(300);

// Test 1: Are cell DOM nodes being replaced? Mark cells, wait, check.
const remountTest = await page.evaluate(async () => {
  // Wait for board
  const board = document.querySelector('[role="grid"]');
  if (!board) return { error: 'no board' };

  // Mark each cell with a unique tag
  const cells = Array.from(board.querySelectorAll('[role="gridcell"]'));
  const initialAriaLabels = cells.map(c => c.getAttribute('aria-label'));
  cells.forEach((c, i) => c.setAttribute('data-mark', `mark-${i}`));

  // Wait 3 seconds (about 15 ticks at start speed)
  await new Promise(r => setTimeout(r, 3000));

  // Re-query and check
  const cellsAfter = Array.from(board.querySelectorAll('[role="gridcell"]'));
  const afterAriaLabels = cellsAfter.map(c => c.getAttribute('aria-label'));
  const afterMarks = cellsAfter.map(c => c.getAttribute('data-mark'));

  // Count cells that lost their mark (i.e. were remounted)
  let cellsWithMark = 0;
  let cellsWithoutMark = 0;
  for (const m of afterMarks) {
    if (m && m.startsWith('mark-')) cellsWithMark++;
    else cellsWithoutMark++;
  }

  // Also: do aria-labels at the same index match? (i.e. is the same logical cell at the same index?)
  let sameIndexSameLabel = 0;
  for (let i = 0; i < Math.min(initialAriaLabels.length, afterAriaLabels.length); i++) {
    if (initialAriaLabels[i] === afterAriaLabels[i]) sameIndexSameLabel++;
  }

  return {
    initialCount: cells.length,
    afterCount: cellsAfter.length,
    cellsWithMark,
    cellsWithoutMark,
    sameIndexSameLabel,
    totalIndices: initialAriaLabels.length,
  };
});

console.log('Remount test:', JSON.stringify(remountTest, null, 2));

// Test 2: How many times does the board render? (Walk fiber, count Board instances)
const renderCountTest = await page.evaluate(async () => {
  const root = document.getElementById('root');
  const fiberKey = Object.keys(root).find(k => k.startsWith('__reactContainer$'));
  if (!fiberKey) return { error: 'no fiber' };

  const container = root[fiberKey];
  const start = container.stateNode?.current;
  if (!start) return { error: 'no current' };

  // Find the Board fiber by following DOM to the board div, then reading its fiber
  const boardDiv = document.querySelector('[role="grid"]');
  if (!boardDiv) return { error: 'no board div' };

  // board div has __reactFiber$xxx pointing to its host fiber
  const boardFiberKey = Object.keys(boardDiv).find(k => k.startsWith('__reactFiber$'));
  if (!boardFiberKey) return { error: 'no board fiber' };

  const boardHostFiber = boardDiv[boardFiberKey];

  // The HostComponent fiber's return is the component that rendered it
  let current = boardHostFiber;
  while (current && current.tag !== 0) current = current.return; // skip HostComponent etc.
  // current is now the Board component fiber
  // Walk the alternate chain to count renders
  const boardRenders = [];
  let f = current;
  let safety = 0;
  while (f && safety < 1000) {
    boardRenders.push({
      hasMemoProps: !!f.memoizedProps,
      hasMemoState: !!f.memoizedState,
      // count children (Cells)
    });
    f = f.alternate;
    safety++;
  }

  // For the current board fiber, count Cell children
  // The board renders 400 cells directly. Walk child fiber to count them.
  const cellCounts = [];
  let child = current.child;
  while (child) {
    cellCounts.push(child.type?.displayName || child.type?.name || '?');
    child = child.sibling;
  }

  return {
    boardRenders: boardRenders.length,
    boardRendersCapped: boardRenders.length === 1000,
    childCount: cellCounts.length,
    firstChildNames: cellCounts.slice(0, 5),
    lastChildNames: cellCounts.slice(-5),
  };
});

console.log('Render count test:', JSON.stringify(renderCountTest, null, 2));

// Test 3: Count Board renders over time using a different technique
// Set up an effect-free render counter by patching the React reconciler
const altRenderTest = await page.evaluate(async () => {
  // Patch React's createElement to count Board/Cell invocations
  if (!window.__createPatched) {
    window.__createPatched = true;
    window.__boardRenders = 0;
    window.__cellRenders = 0;

    // Walk the React tree to find the memoized Board and Cell
    const root = document.getElementById('root');
    const containerKey = Object.keys(root).find(k => k.startsWith('__reactContainer$'));
    const container = root[containerKey];
    const start = container.stateNode?.current;

    // Find the Board component by walking until we find one whose return is a HostComponent with role=grid
    const boardDiv = document.querySelector('[role="grid"]');
    const boardFiberKey = Object.keys(boardDiv).find(k => k.startsWith('__reactFiber$'));
    const boardHostFiber = boardDiv[boardFiberKey];
    let boardCompFiber = boardHostFiber;
    while (boardCompFiber && boardCompFiber.tag !== 0) boardCompFiber = boardCompFiber.return;

    // boardCompFiber is the Board memo component
    // Patch its type to count renders: we can't directly, but we can patch React's reconciler
    // Simpler: use a performance.mark on each render by patching the Board component

    // Actually, simplest: walk alternate chain AFTER playing for a while
    // We'll measure over a window
    return {
      boardFiberFound: !!boardCompFiber,
      boardType: boardCompFiber?.type ? {
        isMemo: boardCompFiber.type.$$typeof?.toString() || 'unknown',
        hasDisplayName: !!boardCompFiber.type.displayName,
        typeName: boardCompFiber.type.name,
      } : null,
    };
  }
});

console.log('Alt render test:', JSON.stringify(altRenderTest, null, 2));

// Test 4: Direct render count via fiber alternate chain over a time window
const timeBasedTest = await page.evaluate(async () => {
  // The Board component fiber's `alternate` chain represents past render states
  // Walk it and count entries between two timestamps
  const boardDiv = document.querySelector('[role="grid"]');
  const boardFiberKey = Object.keys(boardDiv).find(k => k.startsWith('__reactFiber$'));
  const boardHostFiber = boardDiv[boardFiberKey];
  let current = boardHostFiber;
  while (current && current.tag !== 0) current = current.return;

  const startCount = (() => {
    let f = current;
    let n = 0;
    while (f) { n++; f = f.alternate; if (n > 100000) break; }
    return n;
  })();

  // Wait 2 seconds
  await new Promise(r => setTimeout(r, 2000));

  const endCount = (() => {
    let f = current;
    let n = 0;
    while (f) { n++; f = f.alternate; if (n > 100000) break; }
    return n;
  })();

  return {
    startCount: Math.min(startCount, 100000),
    endCount: Math.min(endCount, 100000),
    rendersObserved: endCount - startCount,
  };
});

console.log('Time-based test:', JSON.stringify(timeBasedTest, null, 2));

await browser.close();
