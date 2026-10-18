import test from 'node:test';
import assert from 'node:assert/strict';
import { resample, train, predict, dist, FRAMES } from '../src/lib/recognizer.ts';
import { frameFeatures, DIM } from '../src/lib/features.ts';

let seed = 1;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 0.02;
const seqOf = (base: number) => Array.from({ length: FRAMES * 10 }, (_, i) => Math.sin(i * base) + rnd());
const mk = (label: string, base: number, n = 5) => ({ id: label, label, validated: false, samples: Array.from({ length: n }, () => seqOf(base)) });

test('resample devolve FRAMES*D valores', () => {
  const f = Array.from({ length: 37 }, (_, i) => [i, i * 2, 1]);
  const r = resample(f);
  assert.equal(r.length, FRAMES * 3);
  assert.equal(r[0], 0); assert.equal(r[(FRAMES - 1) * 3], 36);
});
test('classifica sinais cadastrados e rejeita sinal desconhecido', () => {
  const rep = train([mk('Água', 0.3), mk('Dor', 0.9)]);
  assert.ok(rep.model);
  assert.equal(predict(rep.model!, seqOf(0.3)).label, 'Água');
  assert.equal(predict(rep.model!, seqOf(0.9)).label, 'Dor');
  const far = Array.from({ length: FRAMES * 10 }, (_, i) => Math.cos(i * 2.3) * 3);
  assert.equal(predict(rep.model!, far).label, null);
});
test('ignora sinais com poucos exemplos', () => {
  const rep = train([mk('Água', 0.3), mk('Febre', 0.6, 2)]);
  assert.deepEqual(rep.skipped, ['Febre']);
});
test('avisa sinais muito parecidos', () => {
  const rep = train([mk('A', 0.3), mk('B', 0.3)]);
  assert.ok(rep.warnings.length > 0);
});
test('dist é zero para sequências iguais', () => assert.equal(dist([1, 2], [1, 2]), 0));
test('features: dimensão correta e null sem pose/mãos', () => {
  const lm = Array.from({ length: 21 }, (_, i) => ({ x: 0.5 + i * 0.001, y: 0.5, z: 0 }));
  const pose = Array.from({ length: 33 }, (_, i) => ({ x: 0.3 + (i % 2) * 0.4, y: 0.5, z: 0 }));
  assert.equal(frameFeatures([{ label: 'Right', lm }], pose)!.length, DIM);
  assert.equal(frameFeatures([{ label: 'Right', lm }], null), null);
  assert.equal(frameFeatures([], pose), null);
});
