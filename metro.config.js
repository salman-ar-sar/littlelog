// Learn more https://docs.expo.dev/guides/monorepos
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// expo-sqlite web support: bundle the wa-sqlite WASM binary as an asset.
config.resolver.assetExts.push("wasm");

module.exports = withNativeWind(config, { input: "./src/global.css" });
