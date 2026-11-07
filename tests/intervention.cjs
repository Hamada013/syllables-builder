// Goal bank integrity and saved intervention plans.
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
// This package is an ES module package, so read the classic goal script in a sandbox.
const sandbox = { module: { exports: {} } }; sandbox.globalThis = sandbox;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../assets/intervention-goals.js'), 'utf8'), sandbox);
const G = sandbox.module.exports;
(async () => {
  const ids = G.GOALS.flatMap(goal => [goal.id, ...goal.short.map(item => item.id)]);
  assert.equal(new Set(ids).size, ids.length, 'Goal ids are unique');
  const texts = G.GOALS.flatMap(goal => goal.short.map(item => item.text));
  assert.equal(new Set(texts).size, texts.length, 'No duplicated short-term goals');
  assert.deepEqual([...G.LEVELS], [20, 40, 60, 80]); assert.equal(G.ACHIEVED, 80); assert.equal(G.APP.unlocksLevels, false);
  for (const goal of G.GOALS) {
      assert.ok(goal.title && goal.text && goal.short.length >= 2, goal.id);
      assert.ok(goal.sources.length && goal.sources.every(id => G.SOURCES[id]?.url.startsWith('https://')), `${goal.id} cites sources`);
      for (const item of goal.short) { assert.ok(item.text.includes('80%') && item.where, item.id); assert.equal(G.short(item.id).long.id, goal.id); }
  }
  const plan = { childName: 'ليان', therapist: '', start: '2026-11-07', goals: [{ id: 'S1.1', rating: 80, history: [{ date: '2026-11-07T10:00:00Z', rating: 80 }], achieved: '2026-11-07T10:00:00Z' }] };

  const { createProgress } = await import('../progress.js');
  const values = new Map(), storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  let p = createProgress(storage); p.signIn('الطفل');
  assert.equal(p.saveIntervention(plan), true);
  plan.goals[0].rating = 20; assert.equal(p.intervention().goals[0].rating, 80, 'Saved plans are copies');
  p.saveWorkspace({ lastWord: 'apple' });
  p = createProgress(storage); p.signIn('الطفل'); assert.equal(p.intervention().childName, 'ليان', 'The plan survives reopening and other saves');
  console.log(`PASS intervention: ${G.GOALS.length} long-term and ${texts.length} short-term goals with sources, and saved plans.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
