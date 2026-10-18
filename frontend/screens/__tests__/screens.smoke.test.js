jest.mock("react-native-webview", () => ({ WebView: "WebView" }));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: jest.fn(),
  useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
}));

import HomeScreen from "../HomeScreen";
import SearchScreen from "../SearchScreen";
import TripCoverScreen from "../TripCoverScreen";
import TripJournalScreen from "../TripJournalScreen";
import MomentCaptureScreen from "../MomentCaptureScreen";
import RouteMapScreen from "../RouteMapScreen";
import MomentDetailScreen from "../MomentDetailScreen";
import TripRecapScreen from "../TripRecapScreen";
import PassportScreen from "../PassportScreen";
import PublicTripViewerScreen from "../PublicTripViewerScreen";

describe("Screen module exports", () => {
  it("all travel screen modules export components", () => {
    expect(HomeScreen).toBeDefined();
    expect(SearchScreen).toBeDefined();
    expect(TripCoverScreen).toBeDefined();
    expect(TripJournalScreen).toBeDefined();
    expect(MomentCaptureScreen).toBeDefined();
    expect(RouteMapScreen).toBeDefined();
    expect(MomentDetailScreen).toBeDefined();
    expect(TripRecapScreen).toBeDefined();
    expect(PassportScreen).toBeDefined();
    expect(PublicTripViewerScreen).toBeDefined();
  });
});
