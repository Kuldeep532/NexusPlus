const { withProjectBuildGradle, withMainApplication, createRunOncePlugin } = require('@expo/config-plugins');

/**
 * Keeps app-specific Android native modules attached to the Expo/EAS-generated
 * React Native application without modifying the generated project by hand.
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
      'com.nexuswavetech.nexusplus.NexusVaultPackage',
      'com.nexuswavetech.nexusplus.NexusPdfNativePackage',
      'com.nexuswavetech.nexusplus.NexusFileUriPackage',
      'com.nexuswavetech.nexusplus.NexusMediaPackage',
      'com.nexuswavetech.nexusplus.NexusVideoEditorPackage',
      'com.nexuswavetech.nexusplus.NexusVocalRemoverPackage',
    ];

    for (const fqcn of imports) {
      const kotlinImport = `import ${fqcn}`;
      const javaImport = `import ${fqcn};`;
      if (!mod.modResults.contents.includes(kotlinImport) && !mod.modResults.contents.includes(javaImport)) {
        mod.modResults.contents = `${kotlinImport}\n${mod.modResults.contents}`;
      }
    }

    const packageAdds = imports.map((fqcn) => {
      const simpleName = fqcn.split('.').pop();
      return `packages.add(${simpleName}())`;
    });

    const kotlinBlock = [
      `// ${marker}`,
      ...packageAdds.map((line) => `packages.add(${line.replace('packages.add(', '').replace(')', '')}())`),
    ].join('\n');

    const javaBlock = [
      `// ${marker}`,
      ...packageAdds,
    ].map((line) => line.endsWith(';') ? line : `${line};`).join('\n');

    if (mod.modResults.contents.includes('PackageList(this).packages')) {
      const original = 'PackageList(this).packages';
      const replacementKotlin = `${original}.apply {\n${imports.map((fqcn) => `  add(${fqcn.split('.').pop()}())`).join('\n')}\n}`;
      mod.modResults.contents = mod.modResults.contents.replace(original, replacementKotlin);
    } else if (mod.modResults.contents.includes('PackageList(this).packages')) {
      mod.modResults.contents = mod.modResults.contents.replace(
        /PackageList\(this\)\.packages/g,
        `PackageList(this).packages.apply { ${kotlinBlock} }`,
      );
    } else {
      // Java/RN generated projects commonly keep the package list in getPackages().
      mod.modResults.contents = mod.modResults.contents.replace(
        /return\s+new\s+PackageList\(this\)\.getPackages\(\);/,
        `java.util.List<com.facebook.react.ReactPackage> packages = new PackageList(this).getPackages();\n        ${javaBlock.replace(/\n/g, '\n        ')}\n        return packages;`,
      );
    }
    return mod;
  });
}

module.exports = createRunOncePlugin(withNexusNative, 'with-nexus-native', '1.5.0');
