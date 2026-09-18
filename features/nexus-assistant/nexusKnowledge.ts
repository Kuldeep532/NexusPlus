export const NEXUS_KNOWLEDGE = {
  developer: 'Kuldeep Kumar Yadav',
  organization: 'Nexus Wave Technologies',
  product: 'Nexus Plus',
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
  return null;
}
