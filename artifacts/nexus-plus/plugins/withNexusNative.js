const { withProjectBuildGradle, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

const PACKAGE_CLASSES = [
  'NexusVaultPackage',
  'NexusPdfNativePackage',
  'NexusFileUriPackage',
  'NexusMediaPackage',
  'NexusVideoEditorPackage',
  'NexusVocalRemoverPackage',
  'NexusDocumentReaderPackage',
];

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
    const content = mod.modResults.contents;
    if (content.includes(marker)) return mod;

    let updated = content;
    for (const simpleName of PACKAGE_CLASSES) {
      const importLine = `import com.nexuswavetech.nexusplus.${simpleName}`;
      if (!updated.includes(importLine)) updated = `${importLine}\n${updated}`;
    }

    if (updated.includes('PackageList(this).packages')) {
      const additions = PACKAGE_CLASSES.map((name) => `  add(${name}())`).join('\n');
      updated = updated.replace(
        'PackageList(this).packages',
        `PackageList(this).packages.apply {\n    // ${marker}\n${additions}\n}`,
      );
    }

    if (updated.includes('PackageList(this).getPackages()')) {
      const additions = PACKAGE_CLASSES.map((name) => `packages.add(${name}());`).join('\n        ');
      updated = updated.replace(
        'return new PackageList(this).getPackages();',
        `java.util.List<com.facebook.react.ReactPackage> packages = new PackageList(this).getPackages();\n        // ${marker}\n        ${additions}\n        return packages;`,
      );
    }

    mod.modResults.contents = updated;
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.6.0');
