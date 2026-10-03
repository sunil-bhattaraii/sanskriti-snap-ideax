import { COLORS } from "@/constants/colors";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity
} from "react-native";

type FilterType = "All Rewards" | "Food & Drink" | "Experiences" | "Culture" | "Other";

interface RewardFilterProps {
  selectedFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FILTERS: FilterType[] = [
  "All Rewards",
  "Food & Drink",
  "Experiences",
  "Culture",
  "Other",
];

export default function RewardFilter({
  selectedFilter,
  onFilterChange,
}: RewardFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {FILTERS.map((filter) => {
        const isSelected = selectedFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              isSelected && styles.filterButtonActive,
            ]}
            onPress={() => onFilterChange(filter)}
            activeOpacity={0.7}
          >
            <Text
              style={[styles.filterText, isSelected && styles.filterTextActive]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F7F3F0",
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: COLORS.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.tertiary,
  },
  filterTextActive: {
    color: COLORS.white,
  },
});
