import { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

const BACKEND_URL = "http://10.0.2.2:5000/api/found-items";

const MapScreen = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(BACKEND_URL);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.error("Błąd pobierania:", err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Znalezione przedmioty</Text>

      {loading ? (
        <ActivityIndicator size="large" />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text>{item.description}</Text>
              <Text style={styles.date}>
                {new Date(item.dateFound).toLocaleDateString()}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#f2f2f2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  itemTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  date: {
    marginTop: 4,
    color: "#777",
    fontSize: 12,
  },
});
