import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'Acceptance',
    body: 'By installing or using Nexus Plus, you agree to these Terms and Conditions and applicable law. If you do not agree, discontinue use of the application.',
  },
  {
    heading: 'Developer',
    body: 'Nexus Plus is developed by Kuldeep Kumar Yadav. Developer address: Korba, Chhattisgarh, India.',
  },
  {
    heading: 'Files and User Responsibility',
    body: 'You remain responsible for files, media, documents, and other content that you process with Nexus Plus. You must have the necessary rights, licences, permissions, and authority to use, edit, encrypt, convert, share, or distribute the content you select.',
  },
  {
    heading: 'Open-Source APIs and Third-Party Content',
    body: 'Nexus Plus may integrate public, open-source, publicly documented, or community-provided APIs, libraries, radio feeds, metadata services, and other third-party technology. Nexus Plus acts as a client, technical provider, or aggregator and does not claim ownership of third-party copyrighted material. Such integrations do not grant you a licence to copy, redistribute, record, download, or otherwise exploit third-party content outside applicable law and provider terms.',
  },
  {
    heading: 'Third-Party Services',
    body: 'Authentication and selected application services may use Supabase and Firebase. Advertising may use Google AdMob and/or Google AdSense. Online Radio and other network features may rely on external providers. Third-party terms, privacy policies, availability, and technical restrictions apply when you use those services.',
  },
  {
    heading: 'Local Processing',
    body: 'Many Nexus Plus tools are designed to process files on the device. This does not mean every network-based feature is offline. Check the relevant tool description and privacy policy before processing regulated or highly sensitive information.',
  },
  {
    heading: 'Security and Encryption',
    body: 'Security features are designed to reduce risk but cannot guarantee absolute security. File Encryption uses authenticated encryption and password-derived keys. Losing an encryption password may make the encrypted file unrecoverable. Users handling government, enterprise, or regulated data must follow their organisation security policies and approved device controls.',
  },
  {
    heading: 'Prohibited Use',
    body: 'Do not use Nexus Plus to violate law or another person’s rights, distribute malicious software, defeat security controls, circumvent provider restrictions, or infringe copyright and other intellectual-property rights.',
  },
  {
    heading: 'Availability and Changes',
    body: 'Features, APIs, providers, codecs, libraries, and supported devices may change or become unavailable. The developer may update or remove integrations where required by technical, legal, licensing, or security considerations.',
  },
  {
    heading: 'Disclaimer',
    body: 'Nexus Plus is provided as a general-purpose utility application. Except where law requires otherwise, the developer does not guarantee uninterrupted availability, error-free processing, compatibility with every file, or recovery of data affected by device failure, corrupted files, incorrect passwords, or third-party service changes.',
  },
  {
    heading: 'Contact',
    body: 'Questions about these terms can be directed to the support contact published in the Nexus Plus application and Google Play listing.',
  },
];

export default function TermsAndConditionsScreen() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Terms and Conditions"
      intro="These terms describe the responsible use of Nexus Plus, local processing, third-party integrations, open-source APIs, security features, and user responsibilities."
      sections={sections}
    />
  );
}
