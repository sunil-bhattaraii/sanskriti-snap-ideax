import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, ViewStyle } from 'react-native';

interface ProfileAvatarProps {
  displayName?: string;
  imageUrl?: string | null;
  size?: number;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function ProfileAvatar({
  displayName = '',
  imageUrl,
  size = 40,
  onPress,
  style,
}: ProfileAvatarProps) {
  
  // Smartly extract initials (e.g., "Manish Karki" -> "MK", "Sita" -> "S")
  const getInitials = () => {
    if (!displayName) return '?';
    const names = displayName.trim().split(' ');
    if (names.length >= 2) {
      return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
    }
    return names[0].charAt(0).toUpperCase();
  };

  const initials = getInitials();
  const fontSize = size * 0.4; 

  const avatarContent = (
    <View 
      style={[
        styles.container, 
        { width: size, height: size, borderRadius: size / 2, backgroundColor: '#5C3D2E' }, 
        style
      ]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.image} />
      ) : (
        <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} hitSlop={10}>
        {avatarContent}
      </Pressable>
    );
  }

  return avatarContent;
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
    letterSpacing: 1,
  },
});