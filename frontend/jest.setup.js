import "@testing-library/jest-native/extend-expect";

// Additional mocks
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("expo-audio", () => ({
  useAudioRecorder: jest.fn(() => ({
    record: jest.fn(),
    stop: jest.fn(),
    isRecording: false,
  })),
  AudioModule: {
    requestRecordingPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  },
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
}));

jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({
    coords: { latitude: 12.9716, longitude: 77.5946 },
  }),
  reverseGeocodeAsync: jest.fn().mockResolvedValue([{ name: "Hampi Bazaar", street: "Main Rd", city: "Hampi", country: "India" }]),
  useForegroundPermissions: jest.fn().mockReturnValue([{ granted: true }, jest.fn()]),
  Accuracy: { Balanced: 3, High: 4 },
}));

jest.mock("expo-image-picker", () => ({
  launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true, assets: [] }),
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: "granted" }),
  MediaTypeOptions: { Images: "Images" },
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => {
  const React = require("react");
  return {
    Image: (props) => React.createElement("Image", props, props.children),
  };
});

jest.mock(
  "expo-constants",
  () => ({
    expoConfig: {},
  }),
  { virtual: true },
);

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  useRoute: () => ({ params: {} }),
  NavigationContainer: ({ children }) => children,
  DarkTheme: { colors: {} },
}));

jest.mock("@react-navigation/native-stack", () => ({
  createNativeStackNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock("@react-navigation/bottom-tabs", () => ({
  createBottomTabNavigator: () => ({
    Navigator: ({ children }) => children,
    Screen: () => null,
  }),
}));

jest.mock("react-native-webview", () => ({ WebView: "WebView" }));

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: "light",
    Medium: "medium",
    Heavy: "heavy",
  },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));

jest.mock("expo-blur", () => ({
  BlurView: "BlurView",
}));

jest.mock("react-native-safe-area-context", () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

// Global fetch mock
global.fetch = jest.fn();
