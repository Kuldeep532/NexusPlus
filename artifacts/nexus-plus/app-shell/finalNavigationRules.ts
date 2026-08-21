export const FINAL_NAVIGATION_RULES = {
  root: ['home', 'profile', 'settings'] as const,
  welcome: {
    requiresPrivacyPolicyAcceptance: true,
    requiresAuthentication: true,
  },
  home: {
    showOnlyPrimaryFeatureCards: true,
    primaryFeatureCount: 6,
    topRight: ['profile', 'settings'] as const,
  },
  profile: {
    topLevel: true,
    containsAccountInformationOnly: true,
  },
  settings: {
    topLevel: true,
    containsPrivacyPolicy: true,
    containsTermsAndConditions: true,
    containsAboutUs: true,
  },
} as const;
