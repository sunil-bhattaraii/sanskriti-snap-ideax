import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ArtifactDetail } from '../../types/artifact';
import { COLORS } from '../../constants/colors';
import { parseStoryBlocks, isSignificanceBlock } from '../../utils/story';
import StoryCard from './StoryCard';
import MarkdownText from '../MarkdownText';

interface ArtifactContentProps {
  artifact: ArtifactDetail;
  isUnlocked: boolean;
}

export default function ArtifactContent({
  artifact,
  isUnlocked,
}: ArtifactContentProps) {
  const [activeTab, setActiveTab] = useState<'story' | 'significance'>('story');

  const storyBlocks = useMemo(
    () => parseStoryBlocks(artifact.story),
    [artifact.story]
  );
  const storyCards = storyBlocks.filter((block) => !isSignificanceBlock(block));
  const significanceCards = storyBlocks.filter(isSignificanceBlock);
  const hasStoryContent = storyCards.length > 0;

  if (!isUnlocked) {
    return (
      <View style={styles.lockedCard}>
        <View style={styles.lockedIconContainer}>
          <Ionicons name="lock-closed" size={24} color={COLORS.tertiary} />
        </View>
        <Text style={styles.lockedTitle}>Story Locked</Text>
        <MarkdownText
          text={`${artifact.description.slice(0, 140)}${artifact.description.length > 140 ? '...' : ''}`}
          style={styles.lockedDescription}
        />
        <Text style={styles.lockedDescription}>
          Walk {artifact.storyUnlockRadiusMeters}m closer to this location to
          unlock the full hidden history.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.unlockedContent}>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'story' && styles.activeTab]}
          onPress={() => setActiveTab('story')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'story' && styles.activeTabText,
            ]}
          >
            The Story
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'significance' && styles.activeTab]}
          onPress={() => setActiveTab('significance')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'significance' && styles.activeTabText,
            ]}
          >
            Significance
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'story' ? (
        <View style={styles.tabContent}>
          {hasStoryContent ? (
            storyCards.map((block, index) => (
              <StoryCard key={index} block={block} />
            ))
          ) : (
            <View style={styles.storyCard}>
              <View style={styles.cardHeader}>
                <Ionicons
                  name="time-outline"
                  size={20}
                  color={COLORS.primary}
                />
                <Text style={styles.cardTitle}>Historical Context</Text>
              </View>
              <Text style={styles.storyText}>
                Rich historical details about this heritage site.
              </Text>
            </View>
          )}
        </View>
      ) : significanceCards.length > 0 ? (
        <View style={styles.tabContent}>
          {significanceCards.map((block, index) => (
            <StoryCard key={index} block={block} />
          ))}
        </View>
      ) : (
        <View style={styles.tabContent}>
          <View style={styles.storyCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="heart" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Why It Matters</Text>
            </View>
            <Text style={styles.storyText}>
              This heritage site represents an important chapter in our cultural
              history and continues to inspire generations.
            </Text>
          </View>
          <View style={styles.storyCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="people" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>Cultural Connection</Text>
            </View>
            <Text style={styles.storyText}>
              A living testament to the traditions and craftsmanship that define
              our heritage.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  lockedCard: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lockedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  lockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.tertiary,
    marginBottom: 8,
  },
  lockedDescription: {
    fontSize: 14,
    color: COLORS.tertiary,
    textAlign: 'center',
    lineHeight: 20,
  },
  unlockedContent: { gap: 16 },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 2,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginLeft: -2,
  },
  activeTab: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.tertiary },
  activeTabText: { color: COLORS.primary },
  tabContent: { gap: 16 },
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  storyText: { fontSize: 15, lineHeight: 24, color: COLORS.tertiary },
});
