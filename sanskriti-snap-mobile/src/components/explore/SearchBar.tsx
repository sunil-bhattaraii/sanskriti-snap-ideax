import React, { useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";

type SearchResult = { id: string; title: string; subtitle: string; type: "artifact" | "location"; data: any };

interface SearchBarProps {
  query: string;
  setQuery: (query: string) => void;
  results: SearchResult[];
  onSelect: (result: SearchResult) => void;
  onClose: () => void;
  embedded?: boolean;
  onFocus?: () => void;
  autoFocus?: boolean;
}

export default function SearchBar({
  query,
  setQuery,
  results,
  onSelect,
  onClose,
  embedded = false,
  onFocus,
  autoFocus = false,
}: SearchBarProps) {
  const inputRef = useRef<TextInput>(null);

  const selectResult = (result: SearchResult) => {
    inputRef.current?.blur();
    onSelect(result);
    onClose();
  };

  return (
    <View style={embedded ? styles.embeddedContainer : styles.container}>
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={COLORS.primary} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={query}
          onChangeText={setQuery}
          placeholder="Search Patan Heritage..."
          placeholderTextColor="#4A5568"
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={onFocus}
          autoFocus={autoFocus}
          returnKeyType="search"
          onSubmitEditing={() => {
            if (results[0]) selectResult(results[0]);
          }}
        />
        {query.length > 0 ? (
          <TouchableOpacity
            onPress={() => {
              setQuery("");
              onClose();
            }}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={18} color="#4A5568" />
          </TouchableOpacity>
        ) : null}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((result) => (
            <TouchableOpacity key={result.id} style={styles.result} onPress={() => selectResult(result)}>
              <Ionicons name="location-outline" size={18} color={COLORS.primary} />
              <View style={styles.resultText}>
                <Text style={styles.resultTitle} numberOfLines={1}>
                  {result.title}
                </Text>
                <Text style={styles.resultSubtitle} numberOfLines={1}>
                  {result.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", top: 50, left: 0, right: 76, paddingHorizontal: 20, zIndex: 10 },
  embeddedContainer: { flex: 1, position: "relative", top: 0, left: 0, right: 0, paddingHorizontal: 0 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(253, 249, 246, 0.9)",
    borderRadius: 30,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(136, 114, 108, 0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  input: { flex: 1, color: "#4A5568", fontSize: 14, paddingVertical: 0 },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: "rgba(253, 249, 246, 0.98)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(136, 114, 108, 0.2)",
    overflow: "hidden",
  },
  result: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(136, 114, 108, 0.12)",
  },
  resultText: { flex: 1 },
  resultTitle: { color: "#1c1b1a", fontSize: 14, fontWeight: "600" },
  resultSubtitle: { color: "#4A5568", fontSize: 12, marginTop: 2 },
});
