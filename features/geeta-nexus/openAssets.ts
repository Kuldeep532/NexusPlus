export type OpenAssetId =
  | 'bhagavad-gita'
  | 'ashtavakra-gita'
  | 'sri-ram-gita'
  | 'sruti-gita'
  | 'svetashvatra-upanishad'
  | 'aitereya-upanishad'
  | 'brihadaranyaka-upanishad';

export type OpenAsset = {
  id: OpenAssetId;
  title: string;
  subtitle: string;
  description: string;
  entryCount: number;
  category: 'Gita' | 'Upanishad';
  sourceFile: string;
};

export const OPEN_ASSETS: OpenAsset[] = [
  { id:'bhagavad-gita', title:'Bhagavad Gita', subtitle:'18 chapters · 700 verses', description:'Sanskrit shlokas with Hindi and English translations from the supplied dataset.', entryCount:700, category:'Gita', sourceFile:'Main.csv' },
  { id:'ashtavakra-gita', title:'Ashtavakra Gita', subtitle:'298 verses', description:'The dialogue of King Janaka and Sage Ashtavakra.', entryCount:298, category:'Gita', sourceFile:'ashtavakra_gita.csv' },
  { id:'sri-ram-gita', title:'Sri Ram Gita', subtitle:'62 verses', description:'Ram Gita verses from the supplied dataset.', entryCount:62, category:'Gita', sourceFile:'sriram_gita.csv' },
  { id:'sruti-gita', title:'Sruti Gita', subtitle:'33 verses', description:'Sruti Gita verses from the supplied dataset.', entryCount:33, category:'Gita', sourceFile:'sruti_gita.csv' },
  { id:'svetashvatra-upanishad', title:'Svetashvatra Upanishad', subtitle:'113 mantras', description:'Mantras from the supplied Svetashvatra Upanishad dataset.', entryCount:113, category:'Upanishad', sourceFile:'svetashvatra_upanishad.csv' },
  { id:'aitereya-upanishad', title:'Aitereya Upanishad', subtitle:'33 mantras', description:'Mantras from the supplied Aitereya Upanishad dataset.', entryCount:33, category:'Upanishad', sourceFile:'aitereya_upanishad.csv' },
  { id:'brihadaranyaka-upanishad', title:'Brihadaranyaka Upanishad', subtitle:'104 mantras', description:'Mantras from the supplied Brihadaranyaka Upanishad dataset.', entryCount:104, category:'Upanishad', sourceFile:'brihadaranyaka_upanishad.csv' },
];

export function getOpenAsset(id: OpenAssetId) {
  return OPEN_ASSETS.find((asset) => asset.id === id);
}
