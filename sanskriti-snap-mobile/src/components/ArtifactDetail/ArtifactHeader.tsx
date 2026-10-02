import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/colors';
import AppHeader from '../AppHeader';

interface ArtifactHeaderProps {
  onBack: () => void;
  onShare: () => void;
}

export default function ArtifactHeader({
  onBack,
  onShare,
}: ArtifactHeaderProps) {
  return (
    <AppHeader
      title="Artifact Details"
      showBack
      rightActions={
        <TouchableOpacity onPress={onShare} hitSlop={10}>
          <Ionicons name="share-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      }
    />
  );
}
