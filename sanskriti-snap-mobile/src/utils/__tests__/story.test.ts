import { isSignificanceBlock, parseStoryBlocks } from '../story';

describe('parseStoryBlocks', () => {
  it('returns an empty list for null, undefined and empty input', () => {
    expect(parseStoryBlocks(null)).toEqual([]);
    expect(parseStoryBlocks(undefined)).toEqual([]);
    expect(parseStoryBlocks('')).toEqual([]);
    expect(parseStoryBlocks('   \n  \n ')).toEqual([]);
  });

  it('puts text before any heading into an anonymous block', () => {
    const blocks = parseStoryBlocks('Intro line.');
    expect(blocks).toEqual([{ heading: null, level: 0, lines: ['Intro line.'] }]);
  });

  it('splits markdown headings into blocks and records their level', () => {
    const blocks = parseStoryBlocks('## History\nFirst line\nSecond line\n\n## Legacy\nDone');
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({
      heading: 'History',
      level: 2,
      lines: ['First line', 'Second line'],
    });
    expect(blocks[1]).toEqual({ heading: 'Legacy', level: 3 - 1, lines: ['Done'] });
  });

  it('preserves heading levels from # through ######', () => {
    const blocks = parseStoryBlocks('# A\n## B\n### C');
    expect(blocks.map((b) => b.level)).toEqual([1, 2, 3]);
    expect(blocks.map((b) => b.heading)).toEqual(['A', 'B', 'C']);
  });

  it('ignores # characters that are not followed by whitespace', () => {
    const blocks = parseStoryBlocks('C# and #hashtag');
    expect(blocks).toEqual([{ heading: null, level: 0, lines: ['C# and #hashtag'] }]);
  });

  it('strips blank edges inside a block but keeps interior blank lines', () => {
    const blocks = parseStoryBlocks('## H\n\n\nfirst\n\n\nsecond\n\n\n');
    expect(blocks).toEqual([{ heading: 'H', level: 2, lines: ['first', '', '', 'second'] }]);
  });

  it('converts HTML line breaks and paragraph tags into newlines', () => {
    const blocks = parseStoryBlocks('a<br/>b<br />c</p>d');
    expect(blocks).toEqual([
      { heading: null, level: 0, lines: ['a', 'b', 'c', '', 'd'] },
    ]);
  });

  it('converts HTML headings into markdown headings', () => {
    const blocks = parseStoryBlocks('<h2>Significance</h2><p>Body text</p>');
    expect(blocks[0].heading).toBe('Significance');
    expect(blocks[0].level).toBe(2);
    expect(blocks[0].lines).toEqual(['Body text']);
  });

  it('strips any remaining HTML tags from body text', () => {
    const blocks = parseStoryBlocks('A <strong>bold</strong> word<br><em>next</em>');
    expect(blocks[0].lines.join(' ')).toBe('A bold word next');
    expect(blocks[0].lines.join(' ')).not.toContain('<');
  });

  it('decodes the HTML entities a CMS commonly emits', () => {
    const blocks = parseStoryBlocks('A &amp; B &lt;C&gt;&nbsp;D');
    expect(blocks[0].lines.join('')).toBe('A & B <C> D');
  });

  it('leaves the heading with its inner markup removed', () => {
    const blocks = parseStoryBlocks('## A <span>bold</span> title\ntext');
    expect(blocks[0].heading).toBe('A bold title');
  });

  it('handles CRLF line endings', () => {
    const blocks = parseStoryBlocks('## H\r\nline1\r\nline2');
    expect(blocks).toEqual([{ heading: 'H', level: 2, lines: ['line1', 'line2'] }]);
  });

  it('keeps prose before and after separate headings as distinct blocks', () => {
    const blocks = parseStoryBlocks('Prelude\n## One\nBody\n## Two\nMore');
    expect(blocks.map((b) => b.heading)).toEqual([null, 'One', 'Two']);
    expect(blocks[0].lines).toEqual(['Prelude']);
    expect(blocks[2].lines).toEqual(['More']);
  });

  it('never returns a block with a heading and no lines', () => {
    const blocks = parseStoryBlocks('## Empty\n\n## Full\nbody');
    expect(blocks).toHaveLength(2);
    expect(blocks[0].lines).toEqual([]);
    expect(blocks[1].lines).toEqual(['body']);
  });

  it('trims trailing whitespace on every line', () => {
    const blocks = parseStoryBlocks('padded   \nlines  ');
    expect(blocks[0].lines).toEqual(['padded', 'lines']);
  });
});

describe('isSignificanceBlock', () => {
  const block = (heading: string | null) => ({ heading, level: heading ? 2 : 0, lines: ['x'] });

  it('matches the significance heading case-insensitively', () => {
    expect(isSignificanceBlock(block('Significance'))).toBe(true);
    expect(isSignificanceBlock(block('significance'))).toBe(true);
    expect(isSignificanceBlock(block('  SIGNIFICANCE  '))).toBe(true);
  });

  it('rejects other headings and anonymous blocks', () => {
    expect(isSignificanceBlock(block('Historical Significance'))).toBe(false);
    expect(isSignificanceBlock(block('History'))).toBe(false);
    expect(isSignificanceBlock(block(null))).toBe(false);
  });
});
