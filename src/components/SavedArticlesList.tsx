import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { SavedArticle } from "../types";

interface SavedArticlesListProps {
  articles: SavedArticle[];
  onSelect: (article: SavedArticle) => void;
  onDelete: (id: string) => void;
  disabled?: boolean;
}

export const SavedArticlesList: React.FC<SavedArticlesListProps> = ({
  articles,
  onSelect,
  onDelete,
  disabled,
}) => {
  if (articles.length === 0) {
    return null;
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: SavedArticle }) => (
    <View style={styles.itemContainer}>
      <TouchableOpacity
        style={[styles.item, disabled && styles.itemDisabled]}
        onPress={() => onSelect(item)}
        disabled={disabled}
      >
        <Text style={styles.itemTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.itemMeta} numberOfLines={1}>
          {item.language === "en" ? "English" : "Swedish"} • {formatDate(item.savedAt)}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
        disabled={disabled}
      >
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Saved Articles</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        scrollEnabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  header: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  item: {
    flex: 1,
    backgroundColor: "#f0f7ff",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d0e3ff",
  },
  itemDisabled: {
    opacity: 0.5,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 12,
    color: "#666",
  },
  deleteButton: {
    marginLeft: 8,
    padding: 12,
    backgroundColor: "#ffebee",
    borderRadius: 8,
  },
  deleteText: {
    fontSize: 12,
    color: "#c62828",
    fontWeight: "500",
  },
});
