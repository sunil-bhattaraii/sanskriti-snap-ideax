import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { COLORS } from '../../constants/colors';
import type { StoryBlock } from '../../utils/story';
import MarkdownText from '../MarkdownText';

type IconName = ComponentProps<typeof Ionicons>['name'];

type BlockKind =
  | 'history'
  | 'architecture'
  | 'story'
  | 'fun-fact'
  | 'cultural'
  | 'generic';

const FUN_FACT_COLOR = '#D4AF37';

const KIND_CONFIG: Record<BlockKind, { icon: IconName; color: string }> = {
  history: { icon: 'time-outline', color: COLORS.primary },
  architecture: { icon: 'business', color: COLORS.primary },
  story: { icon: 'book-outline', color: COLORS.primary },
  'fun-fact': { icon: 'bulb', color: FUN_FACT_COLOR },
  cultural: { icon: 'people', color: COLORS.primary },
  generic: { icon: 'document-text-outline', color: COLORS.primary },
};

const getBlockKind = (heading: string | null): BlockKind => {
  if (!heading) return 'generic';
  const h = heading.toLowerCase();
  if (h.includes('history') || h.includes('historical')) return 'history';
  if (h.includes('architect')) return 'architecture';
  if (h.includes('story')) return 'story';
  if (h.includes('fact') || h.includes('know')) return 'fun-fact';
  if (h.includes('culture')) return 'cultural';
  return 'generic';
};

interface StoryCardProps {
  block: StoryBlock;
}

export default function StoryCard({ block }: StoryCardProps) {
  const kind = getBlockKind(block.heading);
  const config = KIND_CONFIG[kind];
  const isFunFact = kind === 'fun-fact';

  return (
    <View style={[styles.storyCard, isFunFact && styles.funFactCard]}>
      {block.heading ? (
        <View style={styles.cardHeader}>
          <Ionicons name={config.icon} size={20} color={config.color} />
          <Text style={[styles.cardTitle, isFunFact && { color: config.color }]}>
            {block.heading}
          </Text>
        </View>
      ) : null}
      <MarkdownText
        text={block.lines.join('\n')}
        style={[styles.storyText, isFunFact && styles.funFactText]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  storyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  funFactCard: {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  storyText: { fontSize: 15, lineHeight: 24, color: COLORS.tertiary },
  funFactText: { fontStyle: 'italic' },
});