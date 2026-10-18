import CustomTabBar from "../CustomTabBar";
import LiquidGlass from "../LiquidGlass";
import GlassCard from "../GlassCard";
import DiaryEntryCard from "../DiaryEntryCard";
import DiaryEditorModal from "../DiaryEditorModal";
import SearchBar from "../SearchBar";
import WhatsAppShareModal from "../WhatsAppShareModal";
import InteractiveMap from "../InteractiveMap";
import BottomSheet from "../BottomSheet";
import { SkeletonBox, SkeletonTripCard } from "../SkeletonLoader";
import {
  SurfaceCard,
  AppButton,
  TextField,
  ScreenHeader,
  Badge,
  PriceTag,
  RatingRow,
  SectionHeader,
} from "../SharedUI";

describe("Component module exports", () => {
  it("travel components are defined", () => {
    expect(CustomTabBar).toBeDefined();
    expect(LiquidGlass).toBeDefined();
    expect(GlassCard).toBeDefined();
    expect(DiaryEntryCard).toBeDefined();
    expect(DiaryEditorModal).toBeDefined();
    expect(SearchBar).toBeDefined();
    expect(WhatsAppShareModal).toBeDefined();
    expect(InteractiveMap).toBeDefined();
    expect(BottomSheet).toBeDefined();
    expect(SkeletonBox).toBeDefined();
    expect(SkeletonTripCard).toBeDefined();
  });

  it("shared UI named exports are defined", () => {
    expect(SurfaceCard).toBeDefined();
    expect(AppButton).toBeDefined();
    expect(TextField).toBeDefined();
    expect(ScreenHeader).toBeDefined();
    expect(Badge).toBeDefined();
    expect(PriceTag).toBeDefined();
    expect(RatingRow).toBeDefined();
    expect(SectionHeader).toBeDefined();
  });
});
