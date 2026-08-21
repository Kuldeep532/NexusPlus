const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Keep the native Expo integration prebuild-safe.
 * The actual CMake/native build is owned by the Android project sources;
 * this config plugin only adds the app-local marker needed by that build.
 */
function withNexusNative(config) {
  return withProjectBuildGradle(config, (mod) => {
    const marker = '// Nexus Plus native build marker';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n\n${marker}\next.nexusNativeEnabled = true\n`;
    }
    return mod;
  });
}

module.exports = withNexusNative;
