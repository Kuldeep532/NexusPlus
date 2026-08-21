const { withProjectBuildGradle, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Native Android integration kept behind the Expo config layer so EAS can
 * regenerate the Android project without losing the security/PDF/file modules.
 *
 * iOS remains intentionally untouched; shared TypeScript contracts keep the
 * platform boundary ready for future Keychain/LocalAuthentication/PDF adapters.
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

    const imports = [
      'import com.nexuswavetech.nexusplus.NexusVaultPackage;',
      'import com.nexuswavetech.nexusplus.NexusPdfNativePackage;',
      'import com.nexuswavetech.nexusplus.NexusFileUriPackage;',
    ];

    for (const importLine of imports) {
      if (!mod.modResults.contents.includes(importLine)) {
        mod.modResults.contents = `${importLine}\n${mod.modResults.contents}`;
      }
    }

    const registration = [
      `        // ${marker}`,
      '        packages.add(new NexusVaultPackage());',
      '        packages.add(new NexusPdfNativePackage());',
      '        packages.add(new NexusFileUriPackage());',
    ].join('\n');

    const needle = 'PackageList(this).packages';
    if (mod.modResults.contents.includes(needle)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /PackageList\(this\)\.packages/g,
        `PackageList(this).packages.apply { ${registration.trim()} }`,
      );
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.2.0');
