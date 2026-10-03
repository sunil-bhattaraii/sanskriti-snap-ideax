import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type PolicyContent } from "../../constants/data/mockSettings";

interface Props {
  content: PolicyContent;
}

export default function PolicySection({ content }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.lastUpdated}>
        Last updated: {content.lastUpdated}
      </Text>

      {content.sections.map((section, index) => (
        <View key={index} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.sectionContent}>{section.content}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  lastUpdated: {
    fontSize: 12,
    color: COLORS.tertiary,
    marginBottom: 24,
    fontStyle: "italic",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 14,
    color: COLORS.tertiary,
    lineHeight: 22,
  },
});
