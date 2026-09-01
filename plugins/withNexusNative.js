const { withProjectBuildGradle, createRunOncePlugin } = require('@expo/config-plugins');

function withNexusNative(config) {
  return withProjectBuildGradle(config, (mod) => {
    const marker = '// Nexus Plus native build marker';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n\n${marker}\next.nexusNativeEnabled = true\n`;
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.7.0');
