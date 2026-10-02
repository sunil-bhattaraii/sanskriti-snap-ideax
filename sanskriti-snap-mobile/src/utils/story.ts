export interface StoryBlock {
  heading: string | null;
  lines: string[];
}

export function parseStoryBlocks(story: string | null | undefined): StoryBlock[] {
  if (!story) return [];
  const sections = story.split(/(?=^#{1,3}\s)/m);
  const blocks: StoryBlock[] = [];

  for (const section of sections) {
    const trimmed = section.trim();
    if (!trimmed) continue;

    const lines = trimmed
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) continue;

    let heading: string | null = null;
    let contentLines = lines;

    if (lines[0].startsWith('#')) {
      heading = lines[0].replace(/^#{1,3}\s*/, '').trim();
      contentLines = lines.slice(1);
    }

    blocks.push({
      heading,
      lines: contentLines.length > 0 ? contentLines : [heading || ''],
    });
  }

  if (blocks.length === 0 && story.trim()) {
    blocks.push({
      heading: 'Historical Context',
      lines: [story.trim()],
    });
  }

  return blocks;
}

export function isSignificanceBlock(block: StoryBlock): boolean {
  if (!block.heading) return false;
  const h = block.heading.toLowerCase();
  return (
    h.includes('significance') ||
    h.includes('why it matters') ||
    h.includes('cultural impact') ||
    h.includes('importance')
  );
}
