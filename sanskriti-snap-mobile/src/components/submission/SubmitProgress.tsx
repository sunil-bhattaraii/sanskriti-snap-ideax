import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '@/constants/colors';

export type SubmitStage = 'uploading' | 'verifying' | 'submitting';

const STEPS: { key: SubmitStage; label: string }[] = [
  { key: 'uploading', label: 'Uploading photos' },
  { key: 'verifying', label: 'Verifying snap' },
  { key: 'submitting', label: 'Submitting snap' },
];

interface SubmitProgressProps {
  stage: SubmitStage;
}

export default function SubmitProgress({ stage }: SubmitProgressProps) {
  const activeIndex = STEPS.findIndex((step) => step.key === stage);

  return (
    <View style={styles.card}>
      {STEPS.map((step, index) => {
        const isDone = index < activeIndex;
        const isActive = index === activeIndex;
        return (
          <View key={step.key} style={styles.row}>
            {isDone ? (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={COLORS.success}
              />
            ) : isActive ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Ionicons
                name="ellipse-outline"
                size={22}
                color={COLORS.placeholder}
              />
            )}
            <Text
              style={[styles.label, isActive && styles.activeLabel]}
            >
              {step.label}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 15,
    color: COLORS.placeholder,
    fontWeight: '600',
  },
  activeLabel: {
    color: COLORS.text,
    fontWeight: '800',
  },
});