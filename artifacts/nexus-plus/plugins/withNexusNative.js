const { withAppBuildGradle, withProjectBuildGradle } = require('@expo/config-plugins');

function withNexusNative(config) {
  config = withProjectBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes('nexusNativeCMake')) {
      mod.modResults.contents += `\n\n// Nexus Plus native build configuration\next.nexusNativeCMake = true\n`;
    }
    return mod;
  });

  return withAppBuildGradle(config, (mod) => {
    let gradle = mod.modResults.contents;
    if (!gradle.includes('externalNativeBuild')) {
      gradle = gradle.replace(
        /android\\s*\\{/, 
        `android {\n    defaultConfig {\n        externalNativeBuild {\n            cmake {\n                cppFlags "-std=c++17 -fexceptions -frtti"\n            }\n        }\n    }\n    externalNativeBuild {\n        cmake {\n            path project(':app').file('../../native/CMakeLists.txt')\n        }\n    }`,
      );
    }
    mod.modResults.contents = gradle;
    return mod;
  });
}

module.exports = withNexusNative;
