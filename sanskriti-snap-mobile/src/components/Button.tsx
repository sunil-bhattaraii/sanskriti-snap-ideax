// components/common/Button.tsx
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ActivityIndicator,
    StyleProp,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";
import { COLORS } from "../constants/colors";
import { Icon } from "expo-router";

interface ButtonProps {
  title: string;
  onPress: () => void;

  variant?: 'primary' | 'outline';
  loading?: boolean;
  disabled?: boolean;

  icon?: keyof typeof Ionicons.glyphMap;

  size?: string;
  fullWidth?: boolean;

  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  style?: StyleProp<ViewStyle>;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  loading = false,
  disabled = false,
  icon,
}) => {
  const isPrimary = variant === "primary";

  return (
    <TouchableOpacity
      style={[
        styles.button,
        isPrimary ? styles.primary : styles.outline,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? COLORS.white : COLORS.primary} />
      ) : (
        <>
          <Text
            style={[
              styles.text,
              isPrimary ? styles.primaryText : styles.outlineText,
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
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    flexDirection: "row",
  },
  primary: { backgroundColor: COLORS.primary },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  disabled: { opacity: 0.6 },
  text: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  primaryText: { color: COLORS.white },
  outlineText: { color: COLORS.primary },
  icon: { marginLeft: 8 },
});
