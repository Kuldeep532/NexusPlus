const { withProjectBuildGradle } = require('@expo/config-plugins');

function withNexusNative(config) {
  return withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('nexusNativeCMake')) {
      mod.modResults.contents += '\n\n// Nexus Plus native build marker\next.nexusNativeCMake = true\n';
    }
    return mod;
  });
}

module.exports = withNexusNative;
