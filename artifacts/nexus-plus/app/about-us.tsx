import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'About Nexus Plus',
    body: 'Nexus Plus is a practical, accessible Android utility application that brings media, document, security, accessibility, and everyday productivity tools into one modular experience.',
  },
  {
    heading: 'Developer',
    body: 'Developed by Kuldeep Kumar Yadav. Developer address: Korba, Chhattisgarh, India.',
  },
  {
    heading: 'Local-First Processing',
    body: 'Nexus Plus uses native Android processing where appropriate so that video editing, audio processing, PDF operations, image-to-PDF workflows, file encryption, and similar utilities can operate on-device. Network-based features are clearly distinguished and can depend on third-party providers.',
  },
  {
    heading: 'Open-Source Technology',
    body: 'The project may use open-source libraries, open-source models, publicly documented APIs, and community-maintained tools. Their respective licences and attribution requirements are respected. Open-source availability does not mean that material delivered by an API is free of copyright restrictions.',
  },
  {
    heading: 'Third-Party Providers',
    body: 'Depending on the enabled features, Nexus Plus may use Supabase for authentication, Firebase for selected application services, Google AdMob and/or AdSense for advertising, and third-party radio or metadata providers for network media features. Provider-specific terms and privacy policies apply to their services.',
  },
  {
    heading: 'Content and Copyright',
    body: 'Nexus Plus acts as a software provider, client, or aggregator when connecting to third-party APIs. It does not claim ownership of third-party media, radio streams, metadata, or other copyrighted material supplied by external providers. Users remain responsible for lawful use and must respect copyright, licences, provider terms, and applicable takedown requirements.',
  },
  {
    heading: 'Accessibility',
    body: 'The project aims for clear labels, predictable navigation, semantic controls, strong screen-reader support, and accessible layouts throughout the application.',
  },
  {
    heading: 'Security',
    body: 'Security is treated as a core engineering requirement. Native cryptography, secure platform storage, authenticated encryption, permission minimization, and local-first processing are used where appropriate. No software can honestly guarantee absolute security, so users handling highly sensitive data should also follow their organisational security controls.',
  },
  {
    heading: 'Project Evolution',
    body: 'Nexus Plus is modular so individual tools can be improved without rewriting the rest of the application. Supported features, providers, models, and dependencies may change as the project evolves.',
  },
];

export default function AboutUsScreen() {
  return (
    <LegalPage
      eyebrow="NEXUS PLUS"
      title="About Us"
      intro="Nexus Plus combines accessible mobile utilities with local-first processing, native performance, open-source technology, and clearly disclosed third-party services."
      sections={sections}
    />
  );
}
