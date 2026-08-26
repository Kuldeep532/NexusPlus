export interface SpiritualMessage {
  id: string;
  text: string;
  source?: string;
}

export const SPIRITUAL_MESSAGE_LIBRARY: SpiritualMessage[] = [
  { id: 'focus', text: 'आज अपने कर्म पर ध्यान रखें और फल की चिंता कम करें।', source: 'Bhagavad Gita principle' },
  { id: 'equanimity', text: 'सुख और दुःख में समभाव रखना मन को स्थिर बनाता है।', source: 'Bhagavad Gita principle' },
  { id: 'self', text: 'अपने भीतर की शांति को बाहरी परिस्थितियों पर निर्भर न होने दें।', source: 'Daily reflection' },
  { id: 'discipline', text: 'नियमित साधना छोटे कदमों से भी गहरा परिवर्तन ला सकती है।', source: 'Daily reflection' },
  { id: 'service', text: 'आज किसी एक कार्य को निस्वार्थ भाव से करने का संकल्प लें।', source: 'Daily reflection' },
  { id: 'awareness', text: 'विचारों को देखें, उनसे तुरंत पहचान न बनाएं।', source: 'Meditative reflection' },
  { id: 'gratitude', text: 'आज मिली छोटी-सी कृपा के लिए भी कृतज्ञ रहें।', source: 'Daily reflection' },
  { id: 'truth', text: 'वाणी, विचार और कर्म में सरलता और सत्य का अभ्यास करें।', source: 'Daily reflection' },
];

export function getDailySpiritualMessage(date = new Date()): SpiritualMessage {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  const index = ((day % SPIRITUAL_MESSAGE_LIBRARY.length) + SPIRITUAL_MESSAGE_LIBRARY.length) % SPIRITUAL_MESSAGE_LIBRARY.length;
  return SPIRITUAL_MESSAGE_LIBRARY[index];
}
