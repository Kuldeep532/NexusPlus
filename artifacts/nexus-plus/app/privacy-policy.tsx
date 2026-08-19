import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'Information We Handle',
    body: 'Nexus Plus is designed around local-first utilities. Information you open, create, convert, or store inside the app is handled only as needed to provide the requested feature. The app does not require an account for its core offline tools.',
  },
  {
    heading: 'Local Files and Documents',
    body: 'Files selected for reading, conversion, media playback, or cleanup remain on the device unless you explicitly use a system sharing or export action. Temporary files created during processing are intended to be stored in app-managed temporary storage and cleaned up when no longer required.',
  },
  {
    heading: 'Biometric and Secure Features',
    body: 'When a secure feature uses device authentication, Nexus Plus relies on the operating system authentication mechanism rather than collecting or storing your fingerprint or face data. Secrets should be stored only through the secure storage mechanisms provided by the platform.',
  },
  {
    heading: 'Permissions',
    body: 'Permissions are requested only when a feature needs them, such as selecting a document or accessing media. You can manage granted permissions through Android system settings. Denying a permission may prevent the related feature from working.',
  },
  {
    heading: 'Sharing and Export',
    body: 'If you export a generated file or use the Android share sheet, the destination application and Android system control what happens next. Review the privacy practices of any service you choose to receive your files.',
  },
  {
    heading: 'Changes to This Policy',
    body: 'This page is intentionally maintained as editable app content. Updates can be made here when the app, its permissions, data handling, or legal requirements change. The latest version shown inside Nexus Plus is the version users should rely on.',
  },
  {
    heading: 'Contact',
    body: 'For privacy questions or requests related to Nexus Plus, contact the developer through the support contact published in the app and its store listing.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="Nexus Plus is built with a privacy-first, local-first approach. This policy explains how information and files are handled while you use the app."
      sections={sections}
    />
  );
}
