import React from "react";
import { Platform } from "react-native";
import { render } from "@testing-library/react-native";
import App from "../App";

describe("Web rendering test", () => {
  beforeAll(() => {
    Platform.OS = "web";
  });

  afterAll(() => {
    Platform.OS = "android";
  });

  test("App renders on web without throwing", () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
