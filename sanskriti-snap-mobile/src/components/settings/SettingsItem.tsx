import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "../../constants/colors";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  value?: string;
  hasArrow?: boolean;
  hasToggle?: boolean;
  isToggleOn?: boolean;
  onToggleChange?: (value: boolean) => void;
  onPress?: () => void;
  iconColor?: string;
}

export default function SettingsItem({
  icon,
  title,
  subtitle,
  value,
  hasArrow = false,
  hasToggle = false,
  isToggleOn = false,
  onToggleChange,
  onPress,
  iconColor = COLORS.primary,
}: SettingsItemProps) {
  // Create a light background color for the icon (e.g., #8E3B22 -> #8E3B2220)
  const iconBgColor = iconColor + "20";

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      disabled={!onPress && !hasToggle}
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      <View style={styles.rightContent}>
        {hasToggle ? (
          <Switch
            value={isToggleOn}
            onValueChange={onToggleChange}
            trackColor={{ false: "#E2E8F0", true: COLORS.secondary }}
            thumbColor={isToggleOn ? COLORS.white : "#f4f3f4"}
            ios_backgroundColor="#E2E8F0"
          />
        ) : (
          <>
            {value && <Text style={styles.value}>{value}</Text>}
            {hasArrow && (
              <Ionicons
                name="chevron-forward"
                size={20}
                color={COLORS.tertiary}
              />
            )}
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F7F3F0",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginTop: 2,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  value: {
    fontSize: 15,
    color: COLORS.tertiary,
    fontWeight: "500",
  },
});
