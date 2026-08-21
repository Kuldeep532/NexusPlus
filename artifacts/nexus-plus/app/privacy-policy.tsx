import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'Developer and Address',
    body: 'Nexus Plus is developed by Kuldeep Kumar Yadav. Address: Korba, Chhattisgarh, India. This address is provided for the developer and legal contact location shown with the application.',
  },
  {
    heading: 'Privacy-First and Local Processing',
    body: 'Nexus Plus is designed to process local files on the device whenever the selected feature supports local processing. Video editing, media transformation, PDF tools, image-to-PDF, file encryption, file conversion, biometric-vault content, and similar utilities are intended to operate locally unless a feature explicitly indicates that a third-party service is required. Temporary files may be created in app-managed storage and are removed when no longer needed.',
  },
  {
    heading: 'Feature-by-Feature Data Handling',
    body: 'Media Player: local playback data stays on the device unless you choose an external stream. Video Editor: source media and editing operations are intended to remain on-device. Vocal Remover: native audio processing is intended to remain on-device. PDF Tools, PDF Protector, PDF conversion, and Image to PDF: document bytes are intended to be processed locally. File Encryption: plaintext files and passwords are not uploaded by the feature; encryption and decryption are performed locally. Biometric Vault: secrets are protected with Android secure storage and device authentication. Online Radio: station metadata and streams may come from third-party providers; playback follows the provider stream. Book Reader: selected documents are processed locally. Other utilities follow the permissions and processing description displayed by the relevant feature.',
  },
  {
    heading: 'Authentication and Cloud Services',
    body: 'Supabase may be used for authentication and account-related functions. Firebase may be used for application services such as configuration, analytics, crash reporting, messaging, or other enabled platform services. The exact services enabled can change with future releases. Credentials and authentication tokens are handled through the configured platform mechanisms.',
  },
  {
    heading: 'Advertising',
    body: 'Nexus Plus may use Google AdMob and/or Google AdSense for advertising or monetization where enabled. Google may process device, advertising, or interaction information according to Google policies and the advertising configuration used by the application. Users should review Google advertising and privacy documentation for the applicable region.',
  },
  {
    heading: 'Open-Source APIs and Third-Party Providers',
    body: 'Nexus Plus may use public, open-source, publicly documented, or community-provided APIs and libraries. Some providers may expose media, radio, metadata, or other copyrighted material. Nexus Plus uses such interfaces as a technical provider, client, or aggregator and does not claim ownership of third-party copyrighted content. The application does not grant users permission to reproduce, redistribute, or infringe third-party rights. Users are responsible for using third-party content lawfully and respecting provider terms, licences, copyright, and takedown requirements. Provider availability and content may change without notice.',
  },
  {
    heading: 'Permissions',
    body: 'Permissions are requested only when required for a feature, such as selecting documents, accessing media, recording audio, using the camera, or enabling notifications. Android system controls remain available to revoke permissions.',
  },
  {
    heading: 'Security',
    body: 'Nexus Plus uses platform security features and native processing where appropriate. File Encryption uses authenticated encryption and password-based key derivation in the native layer. No application should be described as absolutely secure; users handling highly sensitive or regulated information should follow their organisation security controls, keep devices updated, and use strong unique passwords.',
  },
  {
    heading: 'Data Retention and Sharing',
    body: 'Nexus Plus does not intentionally upload local files merely because they are opened by a local feature. Data may leave the device when a user explicitly shares, exports, uploads, streams, signs in, or uses a third-party integration. The receiving service then controls its own retention and processing.',
  },
  {
    heading: 'Children and Sensitive Information',
    body: 'Nexus Plus is a general-purpose utility application. Users should not submit sensitive information to third-party services unless they understand the applicable privacy terms and have authority to do so.',
  },
  {
    heading: 'Changes to This Policy',
    body: 'This in-app policy may be updated as features, services, legal requirements, or data practices change. The latest published version should be treated as the current policy.',
  },
  {
    heading: 'Contact',
    body: 'Privacy and legal questions can be directed to the developer through the support contact published in the Nexus Plus application and Google Play listing.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Privacy Policy"
      intro="This policy explains how Nexus Plus handles local files, authentication, advertising, third-party providers, and open-source APIs. It is written for transparency and may be updated with future releases."
      sections={sections}
    />
  );
}
