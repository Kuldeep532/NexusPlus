export type RemoteMantraAudio = {
  id: string;
  title: string;
  mantra: string;
  url: string;
  mimeType: string;
  license: 'CC0-1.0' | 'CC-BY-SA-4.0';
  attribution: string;
  sourceUrl: string;
};
export const REMOTE_MANTRA_AUDIO: RemoteMantraAudio[] = [
  {
    id:'om',
    title:'Om',
    mantra:'ॐ',
    url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/Om.ogg',
    mimeType:'audio/ogg',
    license:'CC0-1.0',
    attribution:'Tito Dutta — public domain dedication (CC0 1.0).',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Om.ogg',
  },
  {
    id:'gayatri',
    title:'Gayatri Mantra',
    mantra:'ॐ भूर्भुवः स्वः तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि धियो यो नः प्रचोदयात्',
    url:'https://upload.wikimedia.org/wikipedia/commons/4/4a/Gayatri_mantra.ogg',
    mimeType:'audio/ogg',
    license:'CC0-1.0',
    attribution:'Wilfredor — public domain dedication (CC0 1.0).',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Gayatri_mantra.ogg',
  },
  {
    id:'guru-stotram',
    title:'Guru Stotram',
    mantra:'Guru Stotram',
    url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/Sanskrit_Chanting_Guru_Stotram.ogg',
    mimeType:'audio/ogg',
    license:'CC0-1.0',
    attribution:'Swami Atmananda / Wikimedia Commons — public domain dedication (CC0 1.0).',
    sourceUrl:'https://commons.wikimedia.org/wiki/File:Sanskrit_Chanting_Guru_Stotram.ogg',
  },
];