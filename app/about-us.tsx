import { LegalDocumentScreen } from '@/features/app-shell/LegalDocumentScreen';

const sections = [
  {
    title: 'Hare Krishna',
    body: 'Nexus Plus is created by Nexus Wave Technologies with a simple belief: technology should reduce friction, increase accessibility, and help people use digital tools with greater independence and clarity.',
  },
  {
    title: 'The Purpose Behind Nexus Wave Technologies',
    body: 'Nexus Wave Technologies was founded with a central spiritual purpose: to use technology as a means of service and to help carry spiritual wisdom into everyday digital life. Accessibility, useful technology and responsible innovation are important parts of that work, but spirituality remains the guiding purpose behind the product vision.',
  },
  {
    title: 'Nexus Plus & Geeta Nexus',
    body: 'Nexus Plus is the main product of Nexus Wave Technologies, and Geeta Nexus is its primary spiritual experience. Geeta Nexus brings the Bhagavad Gita into an accessible digital reading experience with chapter navigation, reading progress and verified verse content. Other utilities exist to support everyday life, while the spiritual purpose remains central to the product direction.',
  },
  {
    title: 'Founder — Kuldeep',
    body: 'Kuldeep is the Founder of Nexus Wave Technologies and the creator behind the Nexus product family. The product vision combines accessibility, practical everyday utilities, technology, and a service-oriented approach to digital innovation.',
  },
  {
    title: 'Our Sacred Mission & Vision',
    body: 'At Nexus Wave Technologies, every line of code we write and every solution we build is offered as a humble service at the lotus feet of the Divine. Our mission is deeply rooted in spreading the timeless, life-transforming wisdom of the Bhagavad Gita, encouraging meaningful daily spiritual practices, and creating digital accessibility for people of all abilities. We believe technology can be a medium for service, clarity, inclusion, and positive transformation.',
  },
  {
    title: 'A Message from Our Founder',
    body: '“True devotion lies in serving humanity through pure intention and unconditional love. My journey has been guided by faith, inner sight, and the sacred teachings of Shri Krishna. Nexus Wave Technologies was born not for commercial glory, but with a pure heart to make digital tools accessible to everyone while keeping spiritual light at the center of innovation.”',
  },
  {
    title: 'Our Devotional Touch: Nexus Plus',
    body: 'Nexus Plus brings that philosophy into practical technology. It is a compact, feature-rich multi-utility application built around accessibility, productivity, security, time assistance, media, document tools, connected-device workflows, and thoughtful digital utilities. We follow the principle that work itself can become worship when it is performed with sincerity, responsibility, and service in mind.',
  },
  {
    title: 'Geeta Nexus Integration',
    body: 'Geeta Nexus was previously maintained as a standalone Bhagavad Gita experience and is now integrated into Nexus Plus for unified accessibility, account, storage, media and feature management. The integrated module currently focuses on Bhagavad Gita reading and chapter progress; additional sacred-text libraries are added only when their verified content is available.',
  },
  {
    title: 'What is Nexus Plus?',
    body: 'Nexus Plus is a versatile digital companion designed to simplify everyday tasks. Its current feature set includes document and PDF utilities, file management and protection, audio and media tools, voice and text-to-speech workflows, accessibility assistance, reminders and time tools, financial-organization utilities, QR tools, connected-device features, news and content aggregation, AI-assisted workflows, authorized remote control, CCTV management, nearby file transfer, and access to the Geeta Nexus spiritual experience where enabled. Feature availability can vary by device, Android version, account status, network and required third-party service.',
  },
  {
    title: 'Accessibility by Design',
    body: 'Accessibility is a core product principle rather than an optional add-on. Nexus Plus uses semantic labels, spoken guidance in relevant workflows, large touch targets, readable hierarchy, theme-aware interfaces, and device-native accessibility capabilities where practical. We continue to improve the experience for users with different abilities and assistive technologies.',
  },
  {
    title: 'Responsible Connected-Device Use',
    body: 'Connected-device features such as remote control and CCTV tools are intended for devices and networks that the user owns or is expressly authorized to operate. Security checks, Android permissions and device capabilities may limit or disable operations that cannot be safely verified.',
  },
  {
    title: 'Technology, APIs and Responsibility',
    body: 'Nexus Plus may connect to backend services and independent APIs to provide selected features. We act as an application and, where applicable, aggregation layer; we do not own the independent infrastructure or guarantee a third-party provider’s security, availability, processing, or results. Our goal is to expose those integrations responsibly while clearly communicating their boundaries to users.',
  },
  {
    title: 'Current Feature Scope',
    body: 'The app can include audio editing and playback, local or provider-backed speech tools, document and PDF processing, e-paper generation, calculator and finance utilities, QR generation and scanning, secure file handling, reminders and time announcements, nearby file transfer, authorized remote-device control, screen casting, CCTV workflows, Nexus Assistant and other accessibility-focused utilities. Some capabilities remain device-dependent or require an installed/native engine and are deliberately not presented as available when those requirements are not met.',
  },
  {
    title: 'Connect With Us',
    body: 'Official Website: nexusweb.co.in\nEmail: info@nexusweb.co.in\nWhatsApp Channel: Join Our Community\nLinkedIn: Nexus Wave Technologies\nInstagram: @nexuswave_technologies\nFacebook: Nexus Wave Technologies Page',
  },
];

export default function AboutUsScreen() {
  return <LegalDocumentScreen title="About Nexus Wave Technologies" subtitle="Our mission, founder, the story behind Nexus Plus, our accessibility-first approach, and how we think about responsible technology." sections={sections} />;
}
