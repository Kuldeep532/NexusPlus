const { withProjectBuildGradle, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Native Android integration kept behind the Expo config layer so EAS can
 * regenerate the Android project without losing the security module.
 *
 * iOS remains intentionally untouched; the shared JS contract has an iOS
 * extension point for a future Keychain/LocalAuthentication implementation.
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
    if (mod.modResults.contents.includes(marker)) return mod;

    const importLine = 'import com.nexuswavetech.nexusplus.NexusVaultPackage;';
    if (!mod.modResults.contents.includes(importLine)) {
      mod.modResults.contents = `${importLine}\n${mod.modResults.contents}`;
    }

    const registration = `\n        // ${marker}\n        packages.add(new NexusVaultPackage());`;
    const needle = 'PackageList(this).packages';
    if (mod.modResults.contents.includes(needle) && !mod.modResults.contents.includes('packages.add(new NexusVaultPackage())')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /PackageList\(this\)\.packages/g,
        `PackageList(this).packages.apply { ${registration.trim()} }`,
      );
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.1.0');
