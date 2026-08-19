import { LegalPage } from '@/components/LegalPage';

const sections = [
  {
    heading: 'About Nexus Plus',
    body: 'Nexus Plus is a focused Android utility application that brings practical everyday tools into one accessible interface. The app is designed to make common tasks easier to discover, operate, and manage from a single home screen.',
  },
  {
    heading: 'What You Can Do',
    body: 'The app brings together tools for reading, media playback, storage cleanup, voice management, secure personal information, document processing, and other utility workflows. New tools can be added without changing the overall navigation model.',
  },
  {
    heading: 'Accessibility',
    body: 'Nexus Plus is developed with clear labels, predictable navigation, readable layouts, semantic controls, and screen-reader-friendly interactions in mind. Accessibility is treated as part of the feature design rather than an afterthought.',
  },
  {
    heading: 'Local-First Design',
    body: 'Where practical, utilities are designed to process files directly on the device. This keeps common workflows fast and reduces unnecessary data movement. Features that use Android system services follow the permissions and behavior of the operating system.',
  },
  {
    heading: 'Developer',
    body: 'Developed by Kuldeep Kumar Yadav. Nexus Plus is an evolving project focused on useful software, accessible interaction, and practical mobile utilities.',
  },
  {
    heading: 'About This Information',
    body: 'This page is structured as editable app content. Product details, supported features, developer information, support details, and other public information can be updated here as Nexus Plus evolves.',
  },
];

export default function AboutUsScreen() {
  return (
    <LegalPage
      eyebrow="NEXUS PLUS"
      title="About Us"
      intro="Learn what Nexus Plus is, why it exists, and how the project approaches useful and accessible mobile utilities."
      sections={sections}
    />
  );
}
