export const NEXUS_KNOWLEDGE = {
  developer: 'Kuldeep Kumar Yadav',
  organization: 'Nexus Wave Technologies',
  product: 'Nexus Plus',
  focusAssist: 'Nexus Focus Assist is the accessibility-first voice and screen-context agent for supported local actions.',
  privacy: 'Voice commands are captured only while a command is being recorded. PDF passwords are kept local and are not sent to Gemini or other cloud providers.',
} as const;

export function answerNexusIdentityQuestion(text: string): string | null {
  const normalized = text.trim().toLowerCase();
  if (!normalized) return null;

  if (/who (made|created|developed) you|who is (the )?developer|developer of nexus|who built (you|nexus)|किसने बनाया|डेवलपर कौन|नक्सस.*किसने बनाया/i.test(normalized)) {
    return `Developed by ${NEXUS_KNOWLEDGE.developer} and ${NEXUS_KNOWLEDGE.organization}.`;
  }

  if (/who are you|what is your name|आप कौन|तुम कौन|तुम्हारा नाम/i.test(normalized)) {
    return `${NEXUS_KNOWLEDGE.product} Assistant, developed by ${NEXUS_KNOWLEDGE.developer} and ${NEXUS_KNOWLEDGE.organization}.`;
  }

  if (/who made nexus plus|developer of nexus plus|नक्सस प्लस.*डेवलपर/i.test(normalized)) {
    return `${NEXUS_KNOWLEDGE.product} was developed by ${NEXUS_KNOWLEDGE.developer} and ${NEXUS_KNOWLEDGE.organization}.`;
  }

  if (/what is nexus plus|what does nexus plus do|नक्सस प्लस क्या है|नक्सस प्लस क्या करता है/i.test(normalized)) {
    return `${NEXUS_KNOWLEDGE.product} is a multi-utility accessibility-focused app with productivity, document, PDF, media, voice, security, and assistant features.`;
  }

  if (/what is focus assist|what does focus assist do|फोकस असिस्ट क्या है|फोकस असिस्ट क्या करता है/i.test(normalized)) {
    return NEXUS_KNOWLEDGE.focusAssist;
  }

  if (/is my password sent|where does my pdf password go|password privacy|क्या पासवर्ड बाहर जाता|पासवर्ड.*कहाँ जाता/i.test(normalized)) {
    return NEXUS_KNOWLEDGE.privacy;
  }

  return null;
}
