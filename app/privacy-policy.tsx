import { LegalDocumentScreen } from '@/features/app-shell/LegalDocumentScreen';

const sections = [
  {
    title: '1. Scope and purpose',
    body: 'This Privacy Policy explains how Nexus Plus, an application published by Nexus Wave Technologies, handles information when you use its features. Nexus Plus is a multi-utility application with productivity, accessibility, media, document, security, notification, financial-assistance, camera, and spiritual content features. We aim to collect and process only what is reasonably required to provide, protect, troubleshoot, and improve the service.',
  },
  {
    title: '2. Information you provide',
    body: 'Depending on the features you use, information may include your name, email address, profile image, account credentials or authentication metadata, settings, reminders, expense records, files you intentionally select for processing, camera images you intentionally capture, saved media preferences, and information you enter for connected devices or services. Do not submit information that you are not authorized to provide.',
  },
  {
    title: '3. Account, authentication and security data',
    body: 'Nexus Plus uses its authentication and backend infrastructure to maintain signed-in sessions and account-related records. The backend may maintain a profile containing your account identifier, display name, avatar URL, account role and premium status. The service also uses a device security identifier and device-integrity verdict for account/device protection. Device-account binding information is restricted by backend security policies and is not intended to be publicly accessible.',
  },
  {
    title: '4. Local and protected storage',
    body: 'Some data is designed to remain on your device. Nexus Plus uses platform-provided secure storage for certain secrets and security-sensitive information, including connected-camera credentials and biometric-vault metadata. The Biometric Vault uses Android-native security facilities and device authentication; it is not a promise that any device is impossible to compromise. Keep your device, operating system, screen lock, and account credentials protected.',
  },
  {
    title: '5. Permissions used by Nexus Plus',
    body: 'Permissions are requested only when a corresponding feature needs them. Camera access is used by the Selfie feature to capture a photo. Photos/media access is used when a feature needs to save selected or captured media to your gallery. Notification access is used for reminders, alarms, and push notifications. Vibration is used for haptic or notification feedback. Exact-alarm and full-screen alarm capabilities support time-assisted alarms where Android permits them. Foreground media-playback service access supports continued media playback. File/document access is requested through the operating-system picker when you choose a file. Biometric/device authentication is used to protect security-sensitive features. Android may add or manage related permissions as required by Expo and the installed feature set.',
  },
  {
    title: '6. Notifications and Firebase services',
    body: 'When Firebase is configured and you enable notifications, Nexus Plus uses Firebase Cloud Messaging through the Android notification stack to obtain a device push token. The app may send the token, platform, app version, and update time to its backend so notifications can be addressed to your device. Firebase configuration also supports a Measurement ID for Google Analytics for Firebase. Analytics should be understood as a third-party measurement service: information processed by Google is subject to Google’s own policies and controls. Nexus Plus does not claim ownership or control over Google’s infrastructure or security practices.',
  },
  {
    title: '7. APIs, AI and third-party providers',
    body: 'Some features use network APIs or provider services. Nexus Plus may act as an application or aggregation layer between you and a provider. For example, the productivity AI workflow reaches Gemini through the Nexus Plus API gateway; the app does not ship a Gemini API key or model weights. When you use a third-party API, the provider may receive the information necessary to answer the request. The provider’s security, availability, retention, processing, and privacy practices are the provider’s responsibility and are governed by its own terms and privacy policy. Nexus Wave Technologies does not represent that it can guarantee the security of an independent API provider.',
  },
  {
    title: '8. Supabase and backend services',
    body: 'Nexus Plus uses Supabase-backed services for authentication and selected cloud data. Backend protections include authenticated access, row-level security for protected tables, restricted device-account data, and security functions for device/account binding. These controls reduce risk but cannot guarantee absolute security. Cloud data remains subject to the security, infrastructure, and availability of the relevant provider as well as your account security.',
  },
  {
    title: '9. Financial and payment-related information',
    body: 'Expense Tracker and Payment Announcer are assistance and organization tools. Expense detection may process notification or message content that you explicitly make available to the feature, depending on the implementation and Android permissions. The app is not a bank, payment network, financial institution, or payment processor. Do not rely on an announcement or automated classification as proof that a transaction occurred. Verify important financial information with your bank, payment provider, or original transaction record.',
  },
  {
    title: '10. Camera, CCTV and connected-device data',
    body: 'Camera features require camera permission and may require media-library access when saving photos. CCTV tools can store connection details and secrets locally using secure storage and may communicate with cameras or network services that you configure. You are responsible for having authorization to access, record, or monitor any camera, network, person, property, or content. Nexus Plus does not grant permission to monitor third parties.',
  },
  {
    title: '11. Documents, files and media',
    body: 'Document, PDF, file, audio, and video tools generally operate on files you intentionally select or create. Where processing is implemented locally, the selected content can remain on the device. Where a feature calls an external service, the relevant content may leave the device as necessary for that request. Review the feature-specific guidance before submitting confidential, regulated, or highly sensitive material to an online provider.',
  },
  {
    title: '12. Security measures and user guidance',
    body: 'Nexus Plus uses HTTPS-based network requests where supported by the service architecture, rejects cleartext traffic in the Android application manifest, uses authenticated backend access for protected operations, applies backend row-level security, uses secure device storage for selected secrets, and provides biometric/device-authentication boundaries for protected features. These are safeguards, not guarantees. Never share passwords, recovery codes, API secrets, payment credentials, or private camera credentials unnecessarily. Keep Android updated and review permissions periodically.',
  },
  {
    title: '13. Data retention and deletion',
    body: 'Retention depends on the type of information and the service involved. Local information can generally be removed by using the relevant feature’s delete controls or by removing app data/uninstalling where applicable. Account and backend information may require an authenticated deletion request or administrative processing. Third-party providers may retain information under their own policies. We do not promise immediate deletion from independent provider systems merely because you delete information in the app.',
  },
  {
    title: '14. Children and sensitive information',
    body: 'Nexus Plus is not designed to encourage children to disclose sensitive information. Do not use the app to collect or process another person’s sensitive information without appropriate authority and consent. Where a feature handles financial, biometric, camera, document, or account information, use additional care and follow applicable laws and platform requirements.',
  },
  {
    title: '15. Third-party links and services',
    body: 'The app may provide links or integrations to websites and services operated by others. Those services are independent from Nexus Wave Technologies. Their privacy practices, content, availability, and security are outside our control. Please read the applicable provider policies before using an external service.',
  },
  {
    title: '16. Changes to this policy',
    body: 'We may update this Privacy Policy when the app, providers, legal requirements, or security practices change. The effective date shown at the top of this page identifies the current version. Material changes may also be communicated through the app or our official website when appropriate.',
  },
  {
    title: '17. Contact',
    body: 'For privacy questions or requests, contact Nexus Wave Technologies at info@nexusweb.co.in. Official website: nexusweb.co.in. Please do not include passwords, API keys, payment credentials, or other secrets in support requests.',
  },
];

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen title="Privacy Policy" subtitle="A clear overview of how Nexus Plus handles permissions, data, security controls, analytics, APIs, and third-party services." sections={sections} />;
}
