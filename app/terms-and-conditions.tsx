import { LegalDocumentScreen } from '@/features/app-shell/LegalDocumentScreen';

const sections = [
  {
    title: '1. Acceptance',
    body: 'By installing, accessing, or using Nexus Plus, you agree to these Terms and Conditions and the Privacy Policy. If you do not agree, do not use the application. If you use a particular feature that has additional terms, those terms also apply to that feature.',
  },
  {
    title: '2. About Nexus Plus',
    body: 'Nexus Plus is a multi-utility application designed to provide accessible productivity, time assistance, media, document, security, financial-assistance, connected-device, and related digital tools. Features may change, be added, restricted, discontinued, or depend on device capabilities and third-party services.',
  },
  {
    title: '3. Lawful and authorized use',
    body: 'You must use Nexus Plus only for lawful purposes and only with content, accounts, devices, networks, cameras, files, and services that you are authorized to access. You must not use the application to invade another person’s privacy, bypass security controls, access systems without permission, distribute unlawful content, or interfere with third-party services.',
  },
  {
    title: '4. Accounts and credentials',
    body: 'You are responsible for maintaining the confidentiality of your account credentials and for activity performed through your account. Use a strong device lock and do not share passwords, recovery codes, API keys, camera credentials, or other secrets. We may restrict an account or device when necessary to protect users, infrastructure, or the integrity of the service.',
  },
  {
    title: '5. Third-party APIs and services',
    body: 'Nexus Plus may aggregate or connect to third-party APIs, AI providers, cloud platforms, notification systems, media sources, or other external services. Nexus Wave Technologies does not own or control those independent services. Their security, uptime, processing, retention, content, and terms are the responsibility of the respective providers. An API provider’s security is not a security guarantee made by Nexus Wave Technologies.',
  },
  {
    title: '6. AI and automated results',
    body: 'AI-generated or automated results may be incomplete, inaccurate, outdated, or unsuitable for a particular purpose. You must independently verify important information. Nexus Plus must not be treated as a substitute for professional legal, medical, financial, security, or other expert advice.',
  },
  {
    title: '7. Financial and payment features',
    body: 'Payment Announcer and Expense Tracker are assistance tools only. They do not constitute banking, payment processing, financial advice, transaction authorization, or proof of payment. You remain responsible for verifying transactions with your bank or payment provider and for protecting financial information.',
  },
  {
    title: '8. Camera, CCTV and monitoring features',
    body: 'Camera and CCTV capabilities must be used only with proper authorization. You are responsible for complying with privacy, recording, surveillance, property, and other applicable laws. Nexus Plus does not authorize you to monitor, record, or access any person or device without the required permission.',
  },
  {
    title: '9. Intellectual property',
    body: 'Nexus Plus software, branding, design, original content, and associated materials are protected by applicable intellectual-property laws. Except where a license expressly permits it, you may not copy, modify, redistribute, reverse engineer, or commercially exploit protected components. Third-party content and services remain subject to their respective licenses and terms.',
  },
  {
    title: '10. Availability and changes',
    body: 'We work to keep Nexus Plus reliable and accessible, but we do not guarantee uninterrupted availability, compatibility with every device, or continued availability of any particular API, provider, media source, or feature. Updates may change behavior, permissions, requirements, or supported devices.',
  },
  {
    title: '11. Security disclaimer',
    body: 'We use reasonable technical and organizational safeguards, but no software, device, network, API, cloud service, or authentication system can be guaranteed to be completely secure. You accept the responsibility to maintain a secure device, use supported software, protect credentials, and exercise appropriate caution with sensitive information.',
  },
  {
    title: '12. Limitation of responsibility',
    body: 'To the maximum extent permitted by applicable law, Nexus Wave Technologies is not responsible for losses caused by unauthorized access to your device or account, third-party services, third-party API behavior, inaccurate automated results, network failures, unsupported devices, misuse of the application, or content supplied by external providers. Nothing in these terms excludes rights or remedies that cannot lawfully be excluded.',
  },
  {
    title: '13. Privacy',
    body: 'Your use of Nexus Plus is also governed by the Nexus Plus Privacy Policy, which explains data handling, permissions, analytics, backend services, local storage, third-party providers, and security practices.',
  },
  {
    title: '14. Termination',
    body: 'You may stop using Nexus Plus at any time. We may suspend or restrict access where reasonably necessary for security, abuse prevention, legal compliance, service integrity, or violation of these terms. Termination does not automatically erase information held by independent third-party providers.',
  },
  {
    title: '15. Contact',
    body: 'Questions about these terms can be sent to info@nexusweb.co.in. Official website: nexusweb.co.in.',
  },
];

export default function TermsAndConditionsScreen() {
  return <LegalDocumentScreen title="Terms & Conditions" subtitle="The rules for safe, lawful, responsible, and transparent use of Nexus Plus." sections={sections} />;
}
