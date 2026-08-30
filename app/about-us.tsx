import { LegalDocumentScreen } from '@/features/app-shell/LegalDocumentScreen';

const sections = [
  {
    title: 'Hare Krishna',
    body: 'Nexus Plus is created by Nexus Wave Technologies with a simple belief: technology should reduce friction, increase accessibility, and help people use digital tools with greater independence and clarity.',
  },
  {
    title: 'Our Sacred Mission & Vision',
    body: 'At Nexus Wave Technologies, every line of code we write and every solution we build is offered as a humble service at the lotus feet of the Divine. Our mission is deeply rooted in spreading the timeless, life-transforming wisdom of the Bhagavad Gita, encouraging meaningful daily spiritual practices, and creating digital accessibility for people of all abilities. We believe technology can be a medium for service, clarity, inclusion, and positive transformation.',
  },
  {
    title: 'A Message from Our Founder',
    body: '“True devotion lies in serving humanity through pure intention and unconditional love. As a blind founder, my journey has been guided by faith, inner sight, and the sacred teachings of Shri Krishna. Nexus Wave Technologies was born not for commercial glory, but with a pure heart to make digital tools accessible to everyone while keeping spiritual light at the center of innovation.”',
  },
  {
    title: 'Our Devotional Touch: Nexus Plus',
    body: 'Nexus Plus brings that philosophy into practical technology. It is a compact, feature-rich multi-utility application built around accessibility, productivity, security, time assistance, media, document tools, and thoughtful digital workflows. We follow the principle that work itself can become worship when it is performed with sincerity, responsibility, and service in mind.',
  },
  {
    title: 'What is Nexus Plus?',
    body: 'Nexus Plus is a versatile digital companion designed to simplify everyday tasks. Its feature set includes productivity assistance, accessible time and alarm tools, document and PDF utilities, file tools, media playback, voice features, security-focused tools, financial-assistance utilities, connected-device features, and access to the Geeta Nexus spiritual experience where enabled.',
  },
  {
    title: 'Accessibility by Design',
    body: 'Accessibility is a core product principle rather than an optional add-on. Nexus Plus uses semantic labels, spoken guidance in relevant workflows, large touch targets, readable hierarchy, theme-aware interfaces, and device-native accessibility capabilities where practical. We continue to improve the experience for users with different abilities and assistive technologies.',
  },
  {
    title: 'Technology, APIs and Responsibility',
    body: 'Nexus Plus may connect to backend services and independent APIs to provide selected features. We act as an application and, where applicable, aggregation layer; we do not own the independent infrastructure or guarantee a third-party provider’s security, availability, processing, or results. Our goal is to expose those integrations responsibly while clearly communicating their boundaries to users.',
  },
  {
    title: 'Connect With Us',
    body: 'Official Website: nexusweb.co.in\nEmail: info@nexusweb.co.in\nWhatsApp Channel: Join Our Community\nLinkedIn: Nexus Wave Technologies\nInstagram: @nexuswave_technologies\nFacebook: Nexus Wave Technologies Page',
  },
];

export default function AboutUsScreen() {
  return <LegalDocumentScreen title="About Nexus Wave Technologies" subtitle="Our mission, the story behind Nexus Plus, our accessibility-first approach, and how we think about responsible technology." sections={sections} />;
}
