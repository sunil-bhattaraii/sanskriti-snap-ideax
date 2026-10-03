import AsyncStorage from '@react-native-async-storage/async-storage';

export const storage = {
  getItem: async (key: string) => {
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string) => {
    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};

