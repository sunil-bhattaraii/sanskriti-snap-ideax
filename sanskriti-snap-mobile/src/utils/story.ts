export type StoryBlock = {
  heading: string | null;
  level: number;
  lines: string[];
};

const SIGNIFICANCE_HEADING = 'significance';

const trimBlankEdges = (lines: string[]) => {
  let start = 0;
  let end = lines.length;
  while (start < end && lines[start].trim() === '') start++;
  while (end > start && lines[end - 1].trim() === '') end--;
  return lines.slice(start, end);
};

export const parseStoryBlocks = (
  story: string | null | undefined
): StoryBlock[] => {
  if (!story) return [];

  const normalizedStory = story
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<h([1-6])[^>]*>(.*?)<\/h\1>/gi, (_, level, heading) =>
      `${'#'.repeat(Number(level))} ${heading.replace(/<[^>]+>/g, '')}\n`,
    )
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
  const blocks: StoryBlock[] = [];
  let current: StoryBlock | null = null;

  const flush = () => {
    if (!current) return;
    current.lines = trimBlankEdges(current.lines);
    blocks.push(current);
    current = null;
  };

  for (const rawLine of normalizedStory.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    const headingMatch = /^(#{1,6})\s+(.+)$/.exec(line);

    if (headingMatch) {
      flush();
      current = {
        heading: headingMatch[2].trim(),
        level: headingMatch[1].length,
        lines: [],
      };
    } else if (line.trim() === '') {
      if (current) current.lines.push('');
    } else {
      if (!current) current = { heading: null, level: 0, lines: [] };
      current.lines.push(line);
    }
  }
  flush();

  return blocks;
};

export const isSignificanceBlock = (block: StoryBlock): boolean =>
  block.heading !== null &&
  block.heading.trim().toLowerCase() === SIGNIFICANCE_HEADING;