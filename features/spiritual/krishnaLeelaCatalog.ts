export type KrishnaLeelaStory = {
  id: string;
  title: string;
  summary: string;
  text: string;
  source?: string;
  sourceUrl?: string;
  sourceType: 'local' | 'online';
  publishedAt?: string;
};

export const BUILTIN_KRISHNA_LEELA_STORIES: KrishnaLeelaStory[] = [
  { id:'krishna-birth', title:'श्रीकृष्ण का जन्म', summary:'मथुरा से गोकुल तक बालकृष्ण के आगमन की संक्षिप्त कथा।', text:'मथुरा में देवकी और वसुदेव कठिन परिस्थितियों में थे। परंपरागत कथा के अनुसार, श्रीकृष्ण का प्राकट्य होने पर वसुदेव उन्हें सुरक्षित रूप से गोकुल ले गए, जहाँ नंद बाबा और यशोदा मैया ने उनका पालन-पोषण किया। गोकुल में बालकृष्ण की बाल-लीलाएँ आरंभ हुईं और उनका जीवन ब्रजवासियों के स्नेह से भर गया।', sourceType:'local' },
  { id:'butter-thief', title:'माखन चोर कृष्ण', summary:'गोकुल में माखन की प्यारी बाल-लीलाएँ।', text:'ब्रज की परंपराओं में बालकृष्ण की माखन-लीला बहुत प्रिय है। वे अपने सखाओं के साथ माखन पाने के नए-नए उपाय करते और उसे सबके साथ बाँटते थे। इन कथाओं में बाल-सुलभ चंचलता, मित्रता और ब्रजवासियों का कृष्ण के प्रति स्नेह दिखाई देता है।', sourceType:'local' },
  { id:'damodara-leela', title:'दामोदर लीला', summary:'यशोदा मैया और बालकृष्ण की प्रसिद्ध उखल-लीला।', text:'एक प्रसिद्ध कथा में यशोदा मैया बालकृष्ण को उनकी शरारतों के कारण उखल से बाँधने का प्रयास करती हैं। रस्सी बार-बार छोटी पड़ती है, फिर बालकृष्ण माता के प्रेम को स्वीकार करते हैं। बाद में वे उखल को खींचते हुए दो वृक्षों के बीच से निकलते हैं और उन वृक्षों से जुड़ी कथा का समाधान होता है।', sourceType:'local' },
  { id:'kaliya-daman', title:'कालिय नाग का दमन', summary:'यमुना के जल से जुड़े कालिय नाग के प्रसंग की सरल कथा।', text:'परंपरागत भागवत कथा में यमुना के एक भाग में कालिय नाग के कारण ब्रजवासी भयभीत होते हैं। कृष्ण यमुना में जाते हैं और कालिय के साथ संघर्ष करते हैं। अंत में कालिय का अहंकार शांत होता है और वह कृष्ण की शरण स्वीकार करता है। ब्रजवासियों का भय दूर हो जाता है।', sourceType:'local' },
  { id:'govardhan-leela', title:'गोवर्धन लीला', summary:'गोवर्धन पर्वत और ब्रजवासियों की रक्षा की प्रसिद्ध कथा।', text:'ब्रज की परंपरा में कृष्ण ब्रजवासियों को गोवर्धन और उनकी जीवन-व्यवस्था के प्रति कृतज्ञता का संदेश देते हैं। इसके बाद प्रचंड वर्षा का प्रसंग आता है। कथा के अनुसार कृष्ण गोवर्धन पर्वत को धारण करके ब्रजवासियों और गौओं को आश्रय देते हैं। अंत में संकट समाप्त होता है और ब्रज में आनंद लौटता है।', sourceType:'local' },
];

export const ONLINE_KRISHNA_LEELA_SOURCE = {
  id: 'bhagavatam-online',
  title: 'श्रीमद्भागवत ऑनलाइन कथा स्रोत',
  url: 'https://www.srimadbhagavatam.org/',
  attribution: 'Śrīmad Bhāgavatam online edition maintained by Anand Aadhar Prabhu.',
  licenseNote: 'The source states that its translation is CC BY-NC-SA 3.0; use only as permitted by that license.',
};

export const KRISHNA_LEELA_STORIES = BUILTIN_KRISHNA_LEELA_STORIES;
