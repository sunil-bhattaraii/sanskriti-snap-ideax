import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '@/components/ui/ProgressBar';

export interface QuestCardProps {
    id: string;
    title: string;
    description: string;
    currentProgress: number;
    totalProgress: number;
    xpReward: number;
    hasBadgeReward: boolean;
    isFavorite?: boolean;
    onPress: () => void;
    style?: ViewStyle;
}

export default function QuestCard({
    title,
    description,
    currentProgress,
    totalProgress,
    xpReward,
    hasBadgeReward,
    isFavorite = false,
    onPress,
    style,
}: QuestCardProps) {
    return (
        <Pressable
            onPress={onPress}
            style={({ pressed }) => [
                styles.card,
                style,
                pressed && styles.cardPressed
            ]}
        >
            {/* Header Section */}
            <View style={styles.header}>
                {/* Placeholder for Quest Icon/Image */}
                <View style={styles.iconContainer}>
                    <Ionicons name="leaf" size={24} color="#8B4513" />
                </View>

                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description} numberOfLines={2}>{description}</Text>
                </View>

                {isFavorite && (
                    <Ionicons name="star" size={20} color="#3B82F6" style={styles.starIcon} />
                )}
                {!isFavorite && (
                    <Ionicons name="star-outline" size={20} color="#9CA3AF" style={styles.starIcon} />
                )}
            </View>

            {/* Progress Section */}
            <View style={styles.progressSection}>
                <ProgressBar
                    current={currentProgress}
                    total={totalProgress}
                    label="Progress"
                    height={8}
                    fillColor="#8B4513"
                    trackColor="#E5E7EB"
                />
            </View>

            {/* Footer / Rewards Section */}
            <View style={styles.footer}>
                <View style={styles.rewardLabel}>
                    <Ionicons name="trophy-outline" size={16} color="#6B7280" />
                    <Text style={styles.rewardText}>Rewards</Text>
                </View>

                <View style={styles.rewardBadges}>
                    {/* XP Reward Badge */}
                    <View style={styles.xpBadge}>
                        <Ionicons name="flash" size={12} color="#F59E0B" style={{ marginRight: 4 }} />
                        <Text style={styles.xpBadgeText}>+{xpReward} XP</Text>
                    </View>

                    {/* Badge Reward Icon */}
                    {hasBadgeReward && (
                        <View style={styles.badgeIconContainer}>
                            <Ionicons name="shield-checkmark-outline" size={16} color="#8B4513" />
                        </View>
                    )}
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    cardPressed: {
        opacity: 0.95,
        transform: [{ scale: 0.98 }],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3E8D8', // Light cream bg for icon
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    titleContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    starIcon: {
        marginLeft: 8,
    },
    progressSection: {
        marginBottom: 16,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingTop: 12,
    },
    rewardLabel: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    rewardText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 6,
        fontWeight: '500',
    },
    rewardBadges: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6', // Light gray pill
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    xpBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1F2937',
    },
    badgeIconContainer: {
        width: 32,
        height: 32,
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    }
});