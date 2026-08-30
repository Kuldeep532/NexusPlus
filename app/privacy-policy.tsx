import { LegalDocumentScreen } from '@/features/app-shell/LegalDocumentScreen';

const sections = [
  {
    title: '1. Overview',
    body: 'Last Updated: August 30, 2026\n\nAt Nexus Wave Technologies, we are committed to protecting your privacy and keeping Nexus Plus transparent, useful, and accessible. Nexus Plus is a multi-utility application that can provide productivity tools, PC remote-control features, document and media utilities, alarms and reminders, accessibility features, security tools, financial-assistance tools, camera and connected-device features, and related services. This policy explains what information may be processed, why it is needed, where it may be processed, and the choices available to you.',
  },
  {
    title: '2. Information we collect or process',
    body: 'Nexus Plus follows a data-minimization approach. Depending on the features you use, information may include account information such as your email address, display name, profile image, authentication identifiers, and account status; app preferences and settings; device and application information needed for security, notifications, troubleshooting, and compatibility; reminders and records you create; files, photos, audio, video, or documents you intentionally select or capture; and information required to configure connected devices or services. We do not sell your personal information or use personal information for third-party advertising.',
  },
  {
    title: '3. Device & connection data',
    body: 'Features such as PC Remote Control and connected-device tools may use local network information and, where supported by the device and feature, Bluetooth to discover, pair with, or communicate with devices you authorize. Local-network commands for remote-control sessions are intended to travel between your devices over the network path required by the feature; Nexus Plus does not intentionally route ordinary local remote-control commands through an unrelated advertising or data-broker network. Network security also depends on your router, computer, Bluetooth environment, operating system, and the devices you connect.',
  },
  {
    title: '4. Permissions and why they are used',
    body: 'Nexus Plus requests Android permissions only for features that need them. Camera: used to capture photos in camera/selfie features. Photos and media: used when you choose to save or access media through supported features. Notifications: used for reminders, alarms, service notifications, and push notifications when enabled. Vibration: used for haptic or notification feedback. Exact alarm and full-screen notification capabilities: used by supported alarm/time-assistance features, subject to Android rules and user settings. Foreground media playback: used to keep supported audio/media playback running when the app is not in the foreground. Files/documents: accessed through the Android system picker when you intentionally select a file. Biometric/device authentication: used to protect supported security-sensitive features. Local network/Bluetooth: used by supported remote-control or device-connection features. Android or Expo may declare additional technical permissions required by the installed feature set; a permission is not treated as authorization to collect unrelated data.',
  },
  {
    title: '5. Local storage and protected data',
    body: 'Nexus Plus stores some preferences and feature data locally on your device. Security-sensitive values, such as selected connected-camera credentials or biometric-vault metadata, may use Android secure storage facilities. Local storage is not an absolute security guarantee: protect your device with a strong screen lock, keep Android updated, and do not share sensitive credentials. You control many local records through the relevant feature and through Android app-data controls.',
  },
  {
    title: '6. Authentication and cloud services',
    body: 'Nexus Plus uses authentication and selected cloud backend services to support accounts and features that require synchronized data. Backend records can include account identifiers, profile information, device-security information, application settings, and feature-specific records. Access to protected backend data is designed to require authenticated authorization and applicable row-level security policies. Cloud infrastructure is provided by third-party service providers, so their infrastructure security and availability are subject to their respective policies and service terms.',
  },
  {
    title: '7. Firebase, notifications and analytics',
    body: 'When push notifications are enabled and the relevant Firebase configuration is active, Nexus Plus can use Firebase Cloud Messaging to obtain and maintain a device push token so notifications can reach the intended device. The service may send the token, platform, app version, and update information to the application backend for notification management. The application configuration also contains support for Google Analytics for Firebase measurement. Where analytics is active in a particular build, Google may process measurement information according to Google’s applicable privacy documentation and controls. Nexus Wave Technologies does not control Google’s independent infrastructure, retention practices, or security guarantees.',
  },
  {
    title: '8. APIs, AI and third-party providers',
    body: 'Some Nexus Plus features communicate with external APIs and service providers. The application may function as an interface or aggregation layer between you and those providers. For example, supported AI functionality can communicate with Gemini through the Nexus Plus API gateway rather than exposing a provider API key inside the mobile application. Information necessary to fulfill a request may be transmitted to the relevant provider. Each provider controls its own infrastructure, security, processing, retention, availability, and terms. Nexus Wave Technologies cannot guarantee the security or availability of an independent API provider and does not claim responsibility for that provider’s internal security controls.',
  },
  {
    title: '9. PC Remote Control',
    body: 'PC Remote Control is intended to help you control a computer that you own or are authorized to manage. Pairing and command exchange may use local network or supported wireless connectivity. You are responsible for securing the computer, local network, pairing information, and any remote-control endpoint. Never use the feature to access a computer or network without authorization.',
  },
  {
    title: '10. Camera, CCTV and connected devices',
    body: 'Camera and CCTV-related features can process connection details, images, video, or device credentials that you intentionally configure or capture. Certain credentials are designed to be stored using secure device storage. You are responsible for having legal authorization to access, record, monitor, or control a camera, property, network, or connected device. Nexus Plus does not grant surveillance rights and should not be used to violate another person’s privacy.',
  },
  {
    title: '11. Expense Tracker and Payment Announcer',
    body: 'These features are convenience and organization tools. Where Android permissions or supported integrations make notification or message content available to the feature, relevant transaction-related text may be processed to help identify or announce payment information. The app is not a bank, payment processor, financial institution, or transaction-authority system. Automated announcements and classifications can be wrong; always verify important transactions with your bank or payment provider. Do not treat an app announcement as proof that money was successfully transferred.',
  },
  {
    title: '12. Documents, files, media and AI processing',
    body: 'Nexus Plus may let you select documents, PDFs, images, audio, or video for local utilities. When a feature processes content entirely on the device, the selected content can remain local. If a feature requires an external API or AI service, relevant content may leave the device to complete the request. Do not submit confidential, regulated, financial, health, authentication, or other sensitive material to a third-party provider unless you are comfortable with that provider’s applicable terms and privacy practices.',
  },
  {
    title: '13. Security measures',
    body: 'Nexus Plus uses reasonable technical safeguards appropriate to the feature, including encrypted network transport where supported, Android cleartext-traffic restrictions, authenticated backend access, backend row-level security for protected data, secure device storage for selected secrets, device/biometric authentication for supported protected features, and controlled access to device-account binding information. No software, device, network, API, cloud service, or authentication mechanism can be guaranteed to be completely secure. Security also depends on your device, operating system, network, account credentials, and third-party providers.',
  },
  {
    title: '14. Data sharing',
    body: 'We do not sell personal information or share it with data brokers for advertising. Information may be processed by service providers when required to provide a feature, including authentication/backend infrastructure, push-notification infrastructure, analytics/measurement services where active, AI/API providers, and other integrations that you choose to use. These providers act under their own terms, policies, and security practices. We may also disclose information when required by applicable law, legal process, fraud prevention, security, or protection of users and services.',
  },
  {
    title: '15. Children’s privacy',
    body: 'Nexus Plus is not designed to solicit personal information from children. We do not knowingly collect personal information from children for the purpose of profiling or advertising. If you believe a child has provided personal information to us without appropriate authorization, contact us so we can review the request and take appropriate action.',
  },
  {
    title: '16. Data retention and deletion',
    body: 'Retention varies by data type and feature. Local data can generally be removed through the relevant feature, Android app-data controls, or uninstalling the application where applicable. Account and backend data may require an authenticated deletion or privacy request. Independent third-party providers may retain information according to their own policies and legal obligations, and deletion from Nexus Plus does not necessarily cause immediate deletion from those independent systems.',
  },
  {
    title: '17. Your choices and safety guidance',
    body: 'You can choose whether to grant optional permissions when Android provides that choice, and you can disable notifications or revoke permissions through Android settings. Use only the features you need, review permissions periodically, keep Android and Nexus Plus updated, use a secure device lock, and never share passwords, recovery codes, API keys, payment credentials, or private camera credentials unnecessarily. For connected devices, use strong unique credentials and secure your local network.',
  },
  {
    title: '18. Third-party links and services',
    body: 'Nexus Plus may link to or integrate with websites and services operated by third parties. Those services are independent of Nexus Wave Technologies. Their content, privacy practices, security, availability, and data retention are governed by their own policies and terms. Please review those policies before submitting information to an external service.',
  },
  {
    title: '19. Changes to this Privacy Policy',
    body: 'We may update this policy when features, providers, security practices, or applicable legal requirements change. The “Last Updated” date identifies the current version. Material changes may also be communicated through the app or official website where appropriate.',
  },
  {
    title: '20. Contact Us',
    body: 'Entity: Nexus Wave Technologies\nWebsite: nexusweb.co.in\nEmail: info@nexusweb.co.in\n\nFor privacy requests, please describe the account or feature involved. Never send passwords, API keys, payment credentials, or other secrets in an email or support request.',
  },
];

export default function PrivacyPolicyScreen() {
  return <LegalDocumentScreen title="Privacy Policy" subtitle="Clear information about Nexus Plus data handling, permissions, security, analytics, APIs, third-party services, and your choices." sections={sections} />;
}
