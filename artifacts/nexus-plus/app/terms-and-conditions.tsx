import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'Acceptance',
    body: 'By installing or using Nexus Plus, you agree to use the application responsibly and in accordance with applicable laws. If you do not agree with these terms, discontinue use of the app.',
  },
  {
    heading: 'Personal Use',
    body: 'Nexus Plus provides general-purpose reading, media, storage, document, privacy, and utility features. You are responsible for the files and information you process and for ensuring that you have the right to use them.',
  },
  {
    heading: 'Accuracy and Availability',
    body: 'The app is provided as a practical utility and may contain limitations, device-specific behavior, or changes between releases. Do not rely on the app as a substitute for professional legal, financial, medical, security, or other specialist advice.',
  },
  {
    heading: 'Third-Party Services',
    body: 'Some platform capabilities, system share targets, or optional integrations may be provided by third parties. Their own terms, permissions, and privacy policies apply when you use those services.',
  },
  {
    heading: 'Prohibited Use',
    body: 'Do not use Nexus Plus to process unlawful material, infringe another person’s rights, interfere with device security, distribute malicious content, or attempt to bypass platform protections.',
  },
  {
    heading: 'Changes',
    body: 'Features, dependencies, supported devices, and these terms may change as Nexus Plus develops. Updated terms will be published in this in-app page so the current version remains easy to review.',
  },
  {
    heading: 'Contact',
    body: 'Questions about these terms can be directed to the developer through the support contact published in the app and its store listing.',
  },
];

export default function TermsAndConditionsScreen() {
  return (
    <LegalPage
      eyebrow="LEGAL"
      title="Terms and Conditions"
      intro="These terms describe the basic conditions for using Nexus Plus and its utilities. They are maintained as app content so they can be updated with future releases."
      sections={sections}
    />
  );
}
