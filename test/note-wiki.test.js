import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  suppWikiToken,
  listWikiTokens,
  listWikiTokensForManage,
  noteWikiTriggerAt,
} from '../src/domain/note-wiki.js';

describe('note-wiki', () => {
  const state = {
    sm: [
      { mfr: 'Thorne', name: 'Magnesium' },
      { mfr: 'Pure', name: 'Mag Glycinate' },
    ],
    noteWikiHidden: ['[[Hidden One]]'],
    noteWikiCustom: ['[[Custom Lab]]'],
  };

  it('suppWikiToken matches export format', () => {
    assert.equal(suppWikiToken('Thorne', 'Magnesium'), '[[Thorne Magnesium]]');
    assert.equal(suppWikiToken('', 'Solo'), '[[Solo]]');
  });

  it('listWikiTokens is alphabetical and filters hidden', () => {
    const all = listWikiTokens(state, '');
    assert.ok(!all.includes('[[Hidden One]]'));
    assert.ok(all.includes('[[Custom Lab]]'));
    assert.ok(all.includes('[[Thorne Magnesium]]'));
    assert.equal(all[0], '[[Custom Lab]]');
  });

  it('listWikiTokens filters by query', () => {
    const hits = listWikiTokens(state, 'mag');
    assert.equal(hits.length, 2);
  });

  it('noteWikiTriggerAt detects [[ with query', () => {
    const t = noteWikiTriggerAt('took [[mag', 10);
    assert.equal(t.start, 5);
    assert.equal(t.query, 'mag');
  });

  it('listWikiTokensForManage includes hidden flag', () => {
    const rows = listWikiTokensForManage({
      sm: [{ mfr: 'X', name: 'Y' }],
      noteWikiHidden: ['[[X Y]]'],
      noteWikiCustom: [],
    });
    assert.equal(rows[0].token, '[[X Y]]');
    assert.equal(rows[0].hidden, true);
  });
});
