import { StyleSheet, Text, View } from "react-native";
import Button from "../../components/UI/Button";
import { useAuth } from "../../store/AuthContext";

const HomeScreen = () => {
  const { userData, logout } = useAuth();
  return (
    <View>
      <Text>home</Text>
      <Text>{userData?.username}</Text>
      <Button onPress={logout}>BACK</Button>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({});
