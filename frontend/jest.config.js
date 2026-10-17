module.exports = {
  preset: "jest-expo",
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest",
  },
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testPathIgnorePatterns: ["/node_modules/", "/e2e/"],
  moduleNameMapper: {
    "^yaml$": "<rootDir>/node_modules/yaml/dist/index.js",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|yaml)",
  ],
  collectCoverageFrom: [
    "services/**/*.js",
    "components/**/*.js",
    "config/**/*.js",
    "!**/node_modules/**",
    "!**/vendor/**",
  ],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  moduleFileExtensions: ["js", "jsx", "json", "ts", "tsx"],
  testTimeout: 10000,
};
