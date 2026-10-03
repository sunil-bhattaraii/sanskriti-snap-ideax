import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "../../constants/colors";
import { type SubmissionData } from "../../constants/data/mockSubmission";

interface Props {
  data: Pick<SubmissionData, "primaryImageUri" | "galleryImages">;
  onRetake?: () => void;
  onAddMore?: () => void;
}

export default function SubmissionPreview({
  data,
  onRetake,
  onAddMore,
}: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>PRIMARY VERIFICATION SNAP</Text>

      <View style={styles.primaryImageBox}>
        {data.primaryImageUri ? (
          <Image source={{ uri: data.primaryImageUri }} style={styles.image} />
        ) : (
          <View style={styles.placeholderContent}>
            <Ionicons name="image-outline" size={40} color="#CBD5E1" />
          </View>
        )}
      </View>

      {data.primaryImageUri && (
        <TouchableOpacity style={styles.retakeButton} onPress={onRetake}>
          <Text style={styles.retakeText}>Retake</Text>
        </TouchableOpacity>
      )}

      <View style={styles.galleryHeader}>
        <Text style={styles.sectionLabel}>ADDITIONAL GALLERY PHOTOS</Text>
        <Text style={styles.photoCount}>
          ({data.galleryImages.length} Photos)
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.galleryRow}
      >
        <TouchableOpacity style={styles.addMoreButton} onPress={onAddMore}>
          <Ionicons name="add" size={24} color={COLORS.tertiary} />
          <Text style={styles.addMoreText}>Add More</Text>
        </TouchableOpacity>

        {data.galleryImages.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.galleryImage} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 24 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.tertiary,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  primaryImageBox: {
    width: "100%",
    height: 200,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  image: { width: "100%", height: "100%" },
  placeholderContent: {},
  retakeButton: {
    alignSelf: "center",
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  retakeText: { fontSize: 13, fontWeight: "600", color: COLORS.tertiary },
  galleryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  photoCount: { fontSize: 12, color: COLORS.tertiary, fontWeight: "600" },
  galleryRow: { gap: 12, paddingRight: 20 },
  addMoreButton: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  addMoreText: {
    fontSize: 10,
    color: COLORS.tertiary,
    marginTop: 4,
    fontWeight: "600",
  },
  galleryImage: { width: 80, height: 80, borderRadius: 12 },
});
