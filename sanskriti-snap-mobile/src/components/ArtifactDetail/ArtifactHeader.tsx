import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import AppHeader from '../AppHeader';

interface ArtifactHeaderProps {
  onBack: () => void;
  onShare: () => void;
  isSaved: boolean;
  onToggleSave: () => void;
}

export default function ArtifactHeader({
  onBack,
  onShare,
  isSaved,
  onToggleSave,
}: ArtifactHeaderProps) {
  return (
    <AppHeader
      title="Artifact Details"
      showBack
      rightActions={
        <>
          <TouchableOpacity onPress={onToggleSave} hitSlop={10}>
            <Ionicons name={isSaved ? 'bookmark' : 'bookmark-outline'} size={24} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare} hitSlop={10}>
            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </>
      }
    />
  );
}
