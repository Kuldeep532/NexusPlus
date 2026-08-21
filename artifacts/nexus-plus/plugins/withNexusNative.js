const { withProjectBuildGradle, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Native Android integration kept behind the Expo config layer so EAS can
 * regenerate the Android project without losing the security or PDF modules.
 * iOS remains intentionally untouched; shared JS contracts provide extension points.
 */
function withNexusNative(config) {
  config = withProjectBuildGradle(config, (mod) => {
    const marker = '// Nexus Plus native build marker';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n\n${marker}\next.nexusNativeEnabled = true\n`;
    }
    return mod;
  });

  return withMainApplication(config, (mod) => {
    const marker = 'Nexus Plus native package registration';
    const importLines = [
      'import com.nexuswavetech.nexusplus.NexusVaultPackage;',
      'import com.nexuswavetech.nexusplus.NexusPdfNativePackage;',
    ];

    for (const importLine of importLines) {
      if (!mod.modResults.contents.includes(importLine)) {
        mod.modResults.contents = `${importLine}\n${mod.modResults.contents}`;
      }
    }

    if (mod.modResults.contents.includes(marker)) return mod;

    const registrations = `\n        // ${marker}\n        packages.add(new NexusVaultPackage());\n        packages.add(new NexusPdfNativePackage());`;
    const needle = 'PackageList(this).packages';
    if (mod.modResults.contents.includes(needle)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /PackageList\(this\)\.packages/g,
        `PackageList(this).packages.apply { ${registrations.trim()} }`,
      );
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.2.0');
