import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BadgeProgress } from '../data/mockBadges';

interface ProgressCircleProps {
  progress: BadgeProgress;
}

export const ProgressCircle: React.FC<ProgressCircleProps> = ({ progress }) => {
  const radius = 60;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const progressPercentage = progress.current / progress.total;
  const strokeDashoffset = circumference - (circumference * progressPercentage);

  return (
    <View style={styles.container}>
      <Svg width={140} height={140} viewBox="0 0 140 140">
        <Circle cx="70" cy="70" r={radius} stroke="#E5E7EB" strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#D4AF37"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
        />
      </Svg>
      <View style={styles.textContainer}>
        <Text style={styles.currentText}>{progress.current}</Text>
        <Text style={styles.totalText}>OF {progress.total}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', marginTop: 24, marginBottom: 24 },
  textContainer: { position: 'absolute', alignItems: 'center' },
  currentText: { fontSize: 36, fontWeight: '800', color: '#1A1A1A', lineHeight: 40 },
  totalText: { fontSize: 14, fontWeight: '600', color: '#6B7280', letterSpacing: 1 },
});