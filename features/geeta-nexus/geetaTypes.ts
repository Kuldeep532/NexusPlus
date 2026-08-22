export interface GitaChapter {
  number: number;
  nameSanskrit: string;
  nameHindi: string;
  nameEnglish: string;
  verseCount: number;
  summary: string;
}

export interface GitaVerse {
  id: string;
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  translationEnglish?: string;
  translationHindi?: string;
  meaningHindi?: string;
  audioUri?: string;
}

export interface GitaAudioTrack {
  id: string;
  chapter: number;
  title: string;
  uri: string;
  durationSeconds?: number;
  source: 'bundled' | 'downloaded';
}

export const GITA_CHAPTERS: GitaChapter[] = [
  { number: 1, nameSanskrit: 'अर्जुनविषादयोग', nameHindi: 'अर्जुन विषाद योग', nameEnglish: 'Arjuna Vishada Yoga', verseCount: 47, summary: 'अर्जुन के विषाद और युद्धभूमि की स्थिति।' },
  { number: 2, nameSanskrit: 'साङ्ख्ययोग', nameHindi: 'सांख्य योग', nameEnglish: 'Sankhya Yoga', verseCount: 72, summary: 'आत्मा, कर्म, ज्ञान और स्थितप्रज्ञता का उपदेश।' },
  { number: 3, nameSanskrit: 'कर्मयोग', nameHindi: 'कर्म योग', nameEnglish: 'Karma Yoga', verseCount: 43, summary: 'निष्काम कर्म और कर्तव्य का मार्ग।' },
  { number: 4, nameSanskrit: 'ज्ञानकर्मसंन्यासयोग', nameHindi: 'ज्ञान कर्म संन्यास योग', nameEnglish: 'Jnana Karma Sannyasa Yoga', verseCount: 42, summary: 'ज्ञान, कर्म और अवतार तत्त्व।' },
  { number: 5, nameSanskrit: 'कर्मसंन्यासयोग', nameHindi: 'कर्म संन्यास योग', nameEnglish: 'Karma Sannyasa Yoga', verseCount: 29, summary: 'कर्मयोग और संन्यास का तुलनात्मक विवेचन।' },
  { number: 6, nameSanskrit: 'आत्मसंयमयोग', nameHindi: 'आत्मसंयम योग', nameEnglish: 'Dhyana Yoga', verseCount: 47, summary: 'ध्यान, मन-संयम और योगाभ्यास।' },
  { number: 7, nameSanskrit: 'ज्ञानविज्ञानयोग', nameHindi: 'ज्ञान विज्ञान योग', nameEnglish: 'Jnana Vijnana Yoga', verseCount: 30, summary: 'परम तत्त्व और भगवान की प्रकृति।' },
  { number: 8, nameSanskrit: 'अक्षरब्रह्मयोग', nameHindi: 'अक्षर ब्रह्म योग', nameEnglish: 'Akshara Brahma Yoga', verseCount: 28, summary: 'ब्रह्म, अध्यात्म और अंतिम स्मरण।' },
  { number: 9, nameSanskrit: 'राजविद्याराजगुह्ययोग', nameHindi: 'राजविद्या राजगुह्य योग', nameEnglish: 'Raja Vidya Raja Guhya Yoga', verseCount: 34, summary: 'परम ज्ञान और भक्ति का रहस्य।' },
  { number: 10, nameSanskrit: 'विभूतियोग', nameHindi: 'विभूति योग', nameEnglish: 'Vibhuti Yoga', verseCount: 42, summary: 'भगवान की दिव्य विभूतियों का वर्णन।' },
  { number: 11, nameSanskrit: 'विश्वरूपदर्शनयोग', nameHindi: 'विश्वरूप दर्शन योग', nameEnglish: 'Vishvarupa Darshana Yoga', verseCount: 55, summary: 'भगवान के विराट विश्वरूप का दर्शन।' },
  { number: 12, nameSanskrit: 'भक्तियोग', nameHindi: 'भक्ति योग', nameEnglish: 'Bhakti Yoga', verseCount: 20, summary: 'भक्ति के स्वरूप और भक्त के गुण।' },
  { number: 13, nameSanskrit: 'क्षेत्रक्षेत्रज्ञविभागयोग', nameHindi: 'क्षेत्र क्षेत्रज्ञ विभाग योग', nameEnglish: 'Kshetra Kshetrajna Vibhaga Yoga', verseCount: 35, summary: 'क्षेत्र, क्षेत्रज्ञ और प्रकृति-पुरुष विवेक।' },
  { number: 14, nameSanskrit: 'गुणत्रयविभागयोग', nameHindi: 'गुणत्रय विभाग योग', nameEnglish: 'Gunatraya Vibhaga Yoga', verseCount: 27, summary: 'सत्त्व, रजस और तमस का विवेचन।' },
  { number: 15, nameSanskrit: 'पुरुषोत्तमयोग', nameHindi: 'पुरुषोत्तम योग', nameEnglish: 'Purushottama Yoga', verseCount: 20, summary: 'क्षर, अक्षर और पुरुषोत्तम का ज्ञान।' },
  { number: 16, nameSanskrit: 'दैवासुरसम्पद्विभागयोग', nameHindi: 'दैवासुर सम्पद विभाग योग', nameEnglish: 'Daivasura Sampad Vibhaga Yoga', verseCount: 24, summary: 'दैवी और आसुरी संपदाओं का विवेचन।' },
  { number: 17, nameSanskrit: 'श्रद्धात्रयविभागयोग', nameHindi: 'श्रद्धात्रय विभाग योग', nameEnglish: 'Shraddhatraya Vibhaga Yoga', verseCount: 28, summary: 'श्रद्धा के तीन प्रकार और उनके प्रभाव।' },
  { number: 18, nameSanskrit: 'मोक्षसंन्यासयोग', nameHindi: 'मोक्ष संन्यास योग', nameEnglish: 'Moksha Sannyasa Yoga', verseCount: 78, summary: 'त्याग, ज्ञान, कर्म, भक्ति और मोक्ष का समन्वित उपदेश।' },
];
