import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';

interface ProgressBarProps {
    current: number;
    total: number;
    label?: string;
    height?: number;
    fillColor?: string;
    trackColor?: string;
    style?: ViewStyle;
}

export default function ProgressBar({
    current,
    total,
    label = 'Progress',
    height = 10,
    fillColor = '#8B4513', // Heritage brown
    trackColor = '#E5E7EB', // Light gray
    style,
}: ProgressBarProps) {
    // Calculate percentage, cap at 100%, avoid division by zero
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;
    const displayPercentage = Math.round(percentage);

    return (
        <View style={[styles.container, style]}>
            {/* Header Row: Label and Value */}
            <View style={styles.header}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>
                    {current}/{total} ({displayPercentage}%)
                </Text>
            </View>

            {/* Progress Track */}
            <View style={[styles.track, { height, backgroundColor: trackColor }]}>
                <View
                    style={[
                        styles.fill,
                        {
                            width: `${percentage}%`,
                            height,
                            backgroundColor: fillColor,
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937', // Dark gray for readability
    },
    value: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
    },
    track: {
        width: '100%',
        borderRadius: 999, // Pill shape
        overflow: 'hidden', // CRITICAL: prevents fill from spilling outside rounded corners
    },
    fill: {
        borderRadius: 999,
    },
});