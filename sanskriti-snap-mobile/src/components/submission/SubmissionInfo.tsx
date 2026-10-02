import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { COLORS } from "../../constants/colors";
import { type SubmissionData } from "../../constants/data/mockSubmission";

interface Props {
  data: Pick<SubmissionData, "privateNote">;
  onNoteChange?: (note: string) => void;
}

export default function SubmissionInfo({ data, onNoteChange }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>PRIVATE NOTE</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a personal memory or detail..."
          placeholderTextColor="#94A3B8"
          value={data.privateNote}
          onChangeText={onNoteChange}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Ionicons name="pencil" size={16} color="#94A3B8" style={styles.icon} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 12,
    minHeight: 80,
  },
  input: { fontSize: 14, color: COLORS.text, paddingRight: 20 },
  icon: { position: "absolute", bottom: 12, right: 12 },
});
