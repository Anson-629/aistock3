import { test } from 'node:test'
import assert from 'node:assert/strict'

import { resolveWatchlistSymbols } from './page'

test('returns default symbols when saved list is empty', () => {
  assert.deepEqual(resolveWatchlistSymbols('[]'), ['2330', '2454', '2382', '6175'])
})

test('normalizes and deduplicates symbols', () => {
  assert.deepEqual(resolveWatchlistSymbols('["2330", "2454", "2330", " 6175 "]'), ['2330', '2454', '6175'])
})

test('falls back to default when saved value is invalid', () => {
  assert.deepEqual(resolveWatchlistSymbols('not-json'), ['2330', '2454', '2382', '6175'])
})
