jest.mock("react-native-webview", () => ({ WebView: "WebView" }));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import HomeScreen from "../HomeScreen";
import SearchScreen from "../SearchScreen";
import LoginScreen from "../LoginScreen";
import RegisterScreen from "../RegisterScreen";
import ProfileScreen from "../ProfileScreen";
import AccountsScreen from "../AccountsScreen";
import ProductDetailScreen from "../ProductDetailScreen";
import TripCoverScreen from "../TripCoverScreen";
import TripJournalScreen from "../TripJournalScreen";
import MomentCaptureScreen from "../MomentCaptureScreen";
import RouteMapScreen from "../RouteMapScreen";
import MomentDetailScreen from "../MomentDetailScreen";
import TripRecapScreen from "../TripRecapScreen";
import PassportScreen from "../PassportScreen";

describe("Screen module exports", () => {
  it("all screen modules export components", () => {
    expect(HomeScreen).toBeDefined();
    expect(SearchScreen).toBeDefined();
    expect(LoginScreen).toBeDefined();
    expect(RegisterScreen).toBeDefined();
    expect(ProfileScreen).toBeDefined();
    expect(AccountsScreen).toBeDefined();
    expect(ProductDetailScreen).toBeDefined();
    expect(TripCoverScreen).toBeDefined();
    expect(TripJournalScreen).toBeDefined();
    expect(MomentCaptureScreen).toBeDefined();
    expect(RouteMapScreen).toBeDefined();
    expect(MomentDetailScreen).toBeDefined();
    expect(TripRecapScreen).toBeDefined();
    expect(PassportScreen).toBeDefined();
  });
});
