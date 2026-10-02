import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from 'react-native';

import { COLORS } from '@/constants/colors';

type ButtonVariant = 'primary' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    title: string;
    onPress: () => void;

    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    disabled?: boolean;
    fullWidth?: boolean;

    icon?: keyof typeof Ionicons.glyphMap;

    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;

    style?: StyleProp<ViewStyle>;
}

const SIZES: Record<ButtonSize, ViewStyle> = {
    sm: { paddingVertical: 10, paddingHorizontal: 16 },
    md: { paddingVertical: 14, paddingHorizontal: 20 },
    lg: { paddingVertical: 16, paddingHorizontal: 24 },
};

const TEXT_SIZES: Record<ButtonSize, number> = {
    sm: 14,
    md: 15,
    lg: 16,
};

export const Button: React.FC<ButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = true,
    icon,
    leftIcon,
    rightIcon,
    style,
}) => {
    const isPrimary = variant === 'primary';
    const isDisabled = disabled || loading;

    return (
        <TouchableOpacity
            style={[
                styles.button,
                SIZES[size],
                fullWidth ? styles.fullWidth : styles.autoWidth,
                isPrimary ? styles.primary : styles.outline,
                isDisabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={isDisabled}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.primary} />
            ) : (
                <>
                    {leftIcon}
                    <Text
                        style={[
                            styles.text,
                            { fontSize: TEXT_SIZES[size] },
                            isPrimary ? styles.primaryText : styles.outlineText,
                            leftIcon ? styles.textWithLeftIcon : null,
                        ]}
                    >
                        {title}
                    </Text>
                    {icon && (
                        <Ionicons
                            name={icon}
                            size={20}
                            color={isPrimary ? COLORS.white : COLORS.primary}
                            style={styles.icon}
                        />
                    )}
                    {rightIcon}
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
    },
    fullWidth: {
        width: '100%',
    },
    autoWidth: {
        alignSelf: 'flex-start',
    },
    primary: { backgroundColor: COLORS.primary },
    outline: {
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    disabled: { opacity: 0.6 },
    text: { fontWeight: '700', letterSpacing: 0.5 },
    textWithLeftIcon: { marginLeft: 8 },
    primaryText: { color: COLORS.white },
    outlineText: { color: COLORS.primary },
    icon: { marginLeft: 8 },
});