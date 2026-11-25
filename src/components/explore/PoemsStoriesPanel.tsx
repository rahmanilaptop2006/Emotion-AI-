import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Feather,
  Heart,
  Sparkles,
  Type,
  Wind,
} from 'lucide-react'
import type { Language } from '../../types'

interface PoemsStoriesPanelProps {
  language: Language
  onExploreLog: (detail?: string) => void
}

type PieceKind = 'story' | 'poem'
type FilterMode = 'all' | 'story' | 'poem'
type ReaderSize = 'sm' | 'md' | 'lg'

interface SanctuaryPiece {
  id: string
  kind: PieceKind
  title: string
  titleHi: string
  subtitle: string
  subtitleHi: string
  moodTag: string
  moodTagHi: string
  readTime: string
  readTimeHi: string
  paragraphs: string[]
  paragraphsHi: string[]
  breathCue: string
  breathCueHi: string
  reflection: string
  reflectionHi: string
}

const SANCTUARY_PIECES: SanctuaryPiece[] = [
  {
    id: 'story-lantern-boat',
    kind: 'story',
    title: 'The Lantern Boat on the Quiet Lake',
    titleHi: 'शांत झील पर लालटेन की नाव',
    subtitle: 'A twilight journey about letting heavy "what-if" thoughts drift away.',
    subtitleHi: 'गोधूलि बेला की एक कहानी—भारी चिंताओं को पानी पर बहा देने के बारे में।',
    moodTag: 'Overthinking Relief',
    moodTagHi: 'अति-चिंतन से राहत',
    readTime: '3 min read',
    readTimeHi: '3 मिनट',
    paragraphs: [
      'Aarav arrived at the wooden pier with a coat pocket full of folded paper notes. Every note held a question that had chased him all week: What if I fall behind? What if tomorrow goes wrong? What if I am not enough?',
      'An old boatman sat beneath a cedar tree, patiently shaping small paper boats and tucking a tiny brass tealight inside each one. Without asking Aarav’s name, he slid a boat across the planks toward him.',
      '"The lake is wide enough to hold things you do not need to carry tonight," the boatman said softly. "Place one worry in the hull. Light it, and let the current decide how far it travels."',
      'At first Aarav hesitated. His mind insisted that holding onto a problem meant staying in control. Still, he unfolded the sharpest note, smoothed the crease between his thumb and palm, and tucked it beneath the warm glow of the lantern.',
      'As the small craft touched the water, ripples widened like slow breathing. The golden reflection stretched across the dark mirror of the lake, shrinking gently into a soft star ten yards out, then twenty. Noticeably, his shoulders dropped an inch.',
      'He folded a second boat, then a third. None of his real responsibilities vanished from tomorrow, yet the tight knot behind his eyes loosened. Watching light drift over still water reminded him of a quiet truth: you can care deeply about your path without carrying every mile at once.',
    ],
    paragraphsHi: [
      'आरव लकड़ी के घाट पर पहुंचा, उसकी जेब मुड़े हुए कागज़ों से भरी थी। हर कागज़ पर एक चिंता लिखी थी—अगर मैं पिछड़ गया तो? अगर कल कुछ गलत हो गया तो?',
      'घाट के पास देवदार के नीचे एक वृद्ध नाविक कागज़ की छोटी नावें बना रहा था और हर नाव में एक नन्हा दीया रख रहा था। उसने मुस्कुराकर एक नाव आरव की ओर बढ़ाई।',
      '"यह झील इतनी विशाल है कि आज रात तुम्हारी भारी चिंताएं संभाल सकती है," नाविक ने धीरे से कहा। "एक उलझन को नाव में रखो और लहरों के हवाले कर दो।"',
      'आरव ने एक मुड़ा हुआ पन्ना खोला और नाव में रखकर पानी में छोड़ दिया। शांत पानी पर सुनहरी लहरें ऐसे फैलीं मानो झील गहरी सांस ले रही हो। दूर जाती रोशनी को देखते ही उसके कंधों का तनाव कुछ कम हो गया।',
      'कल के कर्तव्य अभी भी वहीं थे, लेकिन आज की रात हल्की हो चुकी थी। उसे समझ आया कि मंज़िल की परवाह करने का मतलब हर मील का बोझ एक साथ उठाना नहीं होता।',
    ],
    breathCue: 'Inhale for 4 seconds, picture one looping worry resting on calm water, and exhale slowly for 6 seconds.',
    breathCueHi: '4 सेकंड सांस लें, अपनी एक चिंता को शांत पानी पर तैरता देखें, और 6 सेकंड में धीरे से छोड़ दें।',
    reflection: 'Clarity rarely comes from squeezing a problem harder; it arrives when you give your mind space to breathe.',
    reflectionHi: 'स्पष्टता समस्या को जोर से पकड़ने से नहीं, बल्कि मन को थोड़ा विश्राम देने से आती है।',
  },
  {
    id: 'poem-exhale-horizon',
    kind: 'poem',
    title: 'Exhale the Horizon',
    titleHi: 'सांसों में क्षितिज',
    subtitle: 'Slow lyrical verses paced to soften racing thoughts and shoulder tension.',
    subtitleHi: 'तेज़ विचारों और कंधों के तनाव को शांत करने वाली धीमी लयात्मक कविता।',
    moodTag: 'Breath & Grounding',
    moodTagHi: 'श्वास व शांति',
    readTime: '2 min read',
    readTimeHi: '2 मिनट',
    paragraphs: [
      'Unclench the jaw you did not know was tight,\nLet evening pour its silver through the blind.\nNo mountain needs to move before tonight;\nLeave half the tangled puzzles far behind.',
      'The kettle hums a low, familiar tune,\nThe leaf outside forgets the afternoon.\nYour heart has kept its steady, faithful beat—\nNow gift your hurried thoughts a quiet seat.',
      'Breathe in the cool, unhurried emerald air,\nBreathe out the noise of deadlines everywhere.\nYou are not late; you are simply here—\nEnough, unbroken, steady, calm, and clear.',
    ],
    paragraphsHi: [
      'जो बोझ अनजाने में कंधों पर ठहरा है,\nउसे शाम की नरम हवा में पिघल जाने दो।\nहर उलझन को आज ही सुलझाना ज़रूरी नहीं,\nकुछ सवालों को कल की सुबह पर छोड़ जाने दो।',
      'खिड़की के बाहर पत्तियाँ भी अब थम रही हैं,\nदिन की भागदौड़ धीरे-धीरे कम हो रही है।\nतुम्हारा हृदय हर पल निष्ठा से धड़क रहा है—\nअब अपने चंचल मन को भी थोड़ा विश्राम दो।',
      'गहरी, शांत और शीतल सांस भीतर लो,\nतनाव की हर आवाज़ को धीरे बाहर जाने दो।\nतुम कहीं पिछड़े नहीं हो; तुम यहीं हो—\nसंपूर्ण, शांत, सहज और स्पष्ट।',
    ],
    breathCue: 'Read each stanza once, pausing for one slow breath between verses.',
    breathCueHi: 'हर छंद के बाद एक धीमी सांस लेकर थोड़ा रुकें।',
    reflection: 'Pacing your attention to simple imagery signals safety to your nervous system.',
    reflectionHi: 'शांत शब्दों और छवियों पर ध्यान देने से तंत्रिका तंत्र को सुरक्षा का संकेत मिलता है।',
  },
  {
    id: 'story-clockmaker',
    kind: 'story',
    title: 'The Clockmaker Who Stopped Winding Time',
    titleHi: 'घड़ीसाज़ जिसने समय को आराम दिया',
    subtitle: 'An engaging tale about perfectionism, burnout, and why resting springs keep the truest time.',
    subtitleHi: 'पूर्णतावाद और थकान से उबरने की एक रोचक कहानी—क्यों विश्राम ही असली लय बनाता है।',
    moodTag: 'Burnout & Study Stress',
    moodTagHi: 'थकान व पढ़ाई का दबाव',
    readTime: '4 min read',
    readTimeHi: '4 मिनट',
    paragraphs: [
      'High above the spice market in Shimla, Mira’s workshop ticked with forty-seven brass clocks. As an apprentice determined to prove herself, Mira believed that any clock stopping—even for an hour—was a personal failure. So she wound every spring past midnight, skipping meals whenever a gear fell half a second behind.',
      'One Tuesday morning, her master’s prized astronomical timepiece—the one with the painted moon phase—fell completely silent. Panic flared in Mira’s chest. She tightened the winding key until her knuckles turned white, yet the pendulum refused to swing.',
      'Master Dev stepped over with two steaming cups of tulsi-ginger tea and gently lifted her hand off the brass key. "Listen carefully," he said. "Why does a spring break?"',
      '"Because a part is defective?" Mira guessed.',
      '"No," smiled Dev. "Because someone overwound it without letting it unwind. Every coil needs tension AND release. Force only one half of the rhythm, and the finest mechanism freezes." He placed the warm clay cup in her hands and walked her out onto the cedar balcony.',
      'Down below, mist drifted smoothly through pine valleys without rushing a single branch. Mira sipped slowly—actually tasting the ginger and warmth for the first time in days. When they returned twenty minutes later, Master Dev released the tension latch a quarter-turn, nudged the pendulum with a single fingertip, and the moon dial glided smoothly back to life.',
      'From that evening on, Mira kept a small wooden sign beside her bench: "Rest is not the opposite of progress; it is the coil that keeps tomorrow moving."',
    ],
    paragraphsHi: [
      'शिमला के बाज़ार के ऊपर मीरा की घड़ीसाज़ी की दुकान में सैंतालीस पीतल की घड़ियाँ टिक-टिक करती थीं। मीरा खुद को साबित करने की धुन में आधी रात तक बिना रुके काम करती रहती थी।',
      'एक सुबह उस्ताद देव की सबसे प्रिय चंद्रमा-घड़ी अचानक रुक गई। मीरा घबरा गई और चाबी को पूरी ताकत से कसने लगी, पर पेंडुलम टस से मस नहीं हुआ।',
      'उस्ताद देव दो कप गर्म तुलसी-अदरक की चाय लेकर आए और उसका हाथ रोकते हुए बोले, "कमानी हमेशा टूटती क्यों है? इसलिए नहीं कि वह कमजोर है, बल्कि इसलिए कि उसे खुलने और आराम करने का मौका नहीं मिला।"',
      'वे दोनों बालकनी में गए, जहाँ देवदार की वादियों में धुंध धीरे-धीरे बह रही थी। बीस मिनट शांत बैठने के बाद जब वे लौटे, तो उस्ताद ने तनाव का पेंच थोड़ा ढीला किया—और घड़ी फिर से सहज लय में चलने लगी।',
      'उस दिन से मीरा की मेज़ पर एक वाक्य लिखा था: "विश्राम प्रगति का विरोधी नहीं है; वही वह ऊर्जा है जो कल को गति देती है।"',
    ],
    breathCue: 'Drop your shoulders away from your ears and unclench your hands for 10 seconds.',
    breathCueHi: 'अपने कंधों को नीचे ढीला छोड़ें और हाथों की मुट्ठी 10 सेकंड के लिए खोल लें।',
    reflection: 'Sustainable brilliance relies on recovery windows just as much as focused effort.',
    reflectionHi: 'निरंतर एकाग्रता और सफलता के लिए बीच-बीच में विश्राम उतना ही आवश्यक है जितना परिश्रम।',
  },
  {
    id: 'poem-banyan',
    kind: 'poem',
    title: 'Where the Banyan Listens',
    titleHi: 'बरगद की छांव में',
    subtitle: 'Grounded courtyard imagery rooted in stillness and inner steadiness.',
    subtitleHi: 'शांति और धैर्य का एहसास कराने वाली प्रकृति से जुड़ी कविता।',
    moodTag: 'Emotional Balance',
    moodTagHi: 'भावनात्मक संतुलन',
    readTime: '2 min read',
    readTimeHi: '2 मिनट',
    paragraphs: [
      'A hundred storms have tested banyan wood,\nYet still its patient roots drink from the stone.\nThe wind asks questions never understood,\nThe leaves reply in rustles of their own.',
      'You need not answer every passing fear,\nOr prove your strength to every hurried hour.\nStand like the tree that knows the rain is near,\nAnd turns the thunder gently into flower.',
    ],
    paragraphsHi: [
      'सौ आँधियाँ गुज़रीं उस बूढ़े बरगद के पास से,\nफिर भी उसकी जड़ें धरती को थामे शांत खड़ी हैं।\nहवा हज़ार सवाल पूछती रही हर मौसम में,\nपत्तियाँ बस अपनी मधुर सरसराहट में मुस्कुराती रहीं।',
      'तुम्हें भी हर गुजरते डर को जवाब देने की ज़रूरत नहीं,\nन ही हर भागते घंटे के सामने खुद को साबित करने की।\nउस वृक्ष की तरह स्थिर रहो जो जानता है—\nगर्जना के बाद भी बारिश फूल ही खिलाती है।',
    ],
    breathCue: 'Feel both feet resting firmly against the floor as you finish the last line.',
    breathCueHi: 'अंतिम पंक्ति पढ़ते समय अपने दोनों पैरों को ज़मीन पर मजबूती से महसूस करें।',
    reflection: 'Feelings pass like weather; your core steadiness remains rooted.',
    reflectionHi: 'भावनाएं मौसम की तरह आती-जाती हैं, आपका आंतरिक धैर्य हमेशा बना रहता है।',
  },
  {
    id: 'story-tea-vendor',
    kind: 'story',
    title: 'The Tea Vendor’s Rainy Afternoon',
    titleHi: 'बारिश की दोपहर और चाय की भाप',
    subtitle: 'A cozy, sensory-rich monsoon story about finding calm right inside a busy day.',
    subtitleHi: 'भागदौड़ के बीच भी मन को तुरंत शांत करने वाली मानसून की एक सुखद कहानी।',
    moodTag: 'Instant Calm',
    moodTagHi: 'तुरंत शांति',
    readTime: '3 min read',
    readTimeHi: '3 मिनट',
    paragraphs: [
      'At 4:15 PM, Kabira’s phone wouldn’t stop buzzing. Three group messages, an overdue lab slide deck, and a sudden downpour trapped him under a narrow tin awning across from the campus gate.',
      'Irritated, he stared at his battery icon—11%—until the scent of crushed green cardamom and wet earth drifted past his annoyance. Behind a steaming brass kettle stood a cheerful vendor named Harish, humming softly while rainwater drummed a steady rhythm on the corrugated roof.',
      '"Two minutes till the cardamom boils properly, bhaiya," Harish offered, sliding a small wooden bench clear of splashes. "No sense fighting the cloud; sit while it finishes its work."',
      'Kabira sat. With nothing left to rush toward until the rain eased, he noticed five ordinary things he had walked past a hundred times: the bright emerald gleam of washed mango leaves, the percussion of fat raindrops on warm pavement, steam curling lazily toward the awning, the clink of glass cups, and the deep warmth spreading across his palms when he finally held his kulhad.',
      'By the time the downpour softened into mist ten minutes later, the overdue slides were still waiting—but Kabira’s chest felt twice as spacious. He hadn’t solved his afternoon in those ten minutes; he had simply returned to himself so he could meet it clearly.',
    ],
    paragraphsHi: [
      'शाम 4:15 बजे कबीर का फोन लगातार बज रहा था—असाइनमेंट, संदेश और अचानक तेज़ बारिश ने उसे कॉलेज गेट के सामने एक छोटे टिन शेड के नीचे रोक दिया।',
      'पहले तो वह झुंझलाया, पर तभी गीली मिट्टी और कुटी हुई हरी इलायची की खुशबू ने उसका ध्यान खींचा। भाप उड़ाती केतली के पीछे हरीश भैया मुस्कुराते हुए चाय उबाल रहे थे।',
      '"दो मिनट रुकिए, बारिश से लड़ने से क्या फायदा—जब तक बादल बरस रहा है, बैठिए," हरीश ने बेंच की ओर इशारा किया।',
      'कबीर बैठ गया। उसने पहली बार बारिश से धुले आम के पत्तों की चमक, छत पर बूंदों की ताल, और कुल्हड़ की गर्माहट को पूरी तरह महसूस किया। दस मिनट बाद जब बारिश थमी, काम अभी भी बाकी था—पर कबीर का मन शांत और स्पष्ट हो चुका था।',
    ],
    breathCue: 'Notice 3 calm sensory details around you right now—one sound, one color, one temperature.',
    breathCueHi: 'अभी अपने आस-पास 3 शांत चीज़ें महसूस करें—एक आवाज़, एक रंग और एक तापमान।',
    reflection: 'A two-minute sensory pause resets stress faster than an hour of restless scrolling.',
    reflectionHi: 'दो मिनट का सजग विराम बेचैनी को एक घंटे की स्क्रॉलिंग से कहीं तेजी से शांत करता है।',
  },
  {
    id: 'poem-softly',
    kind: 'poem',
    title: 'Softly, Not All at Once',
    titleHi: 'धीरे-धीरे, एक साथ नहीं',
    subtitle: 'Gentle encouragement for moments when your to-do list feels too tall.',
    subtitleHi: 'जब काम की सूची बहुत लंबी लगे, तब मन को संभालने वाली कोमल कविता।',
    moodTag: 'Self-Compassion',
    moodTagHi: 'आत्म-करुणा',
    readTime: '2 min read',
    readTimeHi: '2 मिनट',
    paragraphs: [
      'A river does not carve the canyon wide\nWithin a single restless afternoon;\nIt trusts the gentle patience of the tide,\nAnd sings along beneath a quiet moon.',
      'Take one small step—the next one you can see,\nDo not demand the whole horizon yet.\nLet kindness guard the space of who you’ll be;\nForgive the pace your tired mind has set.',
    ],
    paragraphsHi: [
      'नदी एक ही दोपहर में चट्टानें नहीं काटती,\nवह धीरज से हर मोड़ को छूकर बहती है।\nचाँदनी के नीचे भी अपनी धुन नहीं छोड़ती,\nबस छोटे-छोटे कदमों से राह बनाती रहती है।',
      'बस अगला एक छोटा कदम उठाओ जो सामने दिखता है,\nअभी पूरा आसमान मुट्ठी में भरने की ज़िद न करो।\nअपने थके मन से थोड़ी करुणा के साथ बात करो—\nतुम जितना सोचते हो, उससे कहीं बेहतर चल रहे हो।',
    ],
    breathCue: 'Place one hand gently over your heart and whisper: "One calm step at a time."',
    breathCueHi: 'अपने हृदय पर हल्का हाथ रखकर मन में कहें: "एक समय में बस एक शांत कदम।"',
    reflection: 'Small steady steps always outlast frantic sprints.',
    reflectionHi: 'छोटे और शांत कदम हमेशा जल्दबाज़ी से आगे निकलते हैं।',
  },
  {
    id: 'story-two-stones',
    kind: 'story',
    title: 'The Hiker Who Carried Extra Stones',
    titleHi: 'यात्री और बोझ के पत्थर',
    subtitle: 'A bright mountain parable about setting down yesterday’s regrets and tomorrow’s fears.',
    subtitleHi: 'कल की पछतावे और आने वाले कल के डर को नीचे रखने की एक प्रेरणादायक कहानी।',
    moodTag: 'Letting Go',
    moodTagHi: 'मन हल्का करना',
    readTime: '3 min read',
    readTimeHi: '3 मिनट',
    paragraphs: [
      'Two travelers set off at dawn toward Sunlit Ridge. Before noon, Rohan’s knees already ached while his companion Maya walked with an effortless bounce.',
      '"How are you still singing?" Rohan panted, adjusting his heavy pack. "Isn’t this trail steep?"',
      'Maya grinned and asked him to open his backpack. Inside, beside water and fruit, sat six jagged river stones. "Wait—why are you hiking up a mountain with rocks?" she laughed gently.',
      '"Well," Rohan admitted, sheepish, "this large grey one is an argument I lost last month. This sharp one is a syllabus chapter I still haven’t started. And these three are things people might say about my presentation next Friday."',
      'Maya picked up the grey stone and set it smoothly beside a wildflower on the trail edge. "The mountain asks only for the steps beneath your boots right now. Keep your water, keep your map, and leave the stones for the earth to hold."',
      'By the time Rohan emptied the unnecessary weight onto the mossy bank, the afternoon climb hadn’t changed slope—yet every step suddenly felt light enough to enjoy the pine breeze.',
    ],
    paragraphsHi: [
      'भोर होते ही दो यात्री पहाड़ी रास्ते पर निकले। दोपहर तक रोहन बुरी तरह थक चुका था, जबकि उसकी साथी माया अब भी गुनगुनाते हुए चल रही थी।',
      'जब माया ने रोहन का बैग खुलवाया, तो उसमें पानी और फल के साथ छह भारी पत्थर रखे थे। रोहन ने झेंपते हुए बताया, "यह बड़ा पत्थर पिछले महीने की एक गलती है, यह नुकीला पत्थर अगले हफ्ते की चिंता है..."',
      'माया ने मुस्कुराते हुए पत्थर उठाकर रास्ते के किनारे फूलों के पास रख दिए। "पहाड़ तुमसे सिर्फ इस पल के कदम मांगता है। पानी और नक्शा साथ रखो, बाकी बोझ धरती को थामने दो।"',
      'बैग हल्का होते ही चढ़ाई वही थी, पर रोहन के हर कदम में हवा जैसी ताज़गी लौट आई।',
    ],
    breathCue: 'Name one unnecessary "stone" you can set down for the next two hours.',
    breathCueHi: 'अगले दो घंटों के लिए किसी एक अनावश्यक चिंता के पत्थर को मन से नीचे रख दें।',
    reflection: 'Dropping imagined weight restores energy for what actually matters today.',
    reflectionHi: 'काल्पनिक बोझ उतारने से आज के वास्तविक कामों के लिए नई ऊर्जा मिलती है।',
  },
  {
    id: 'poem-night-watch',
    kind: 'poem',
    title: 'Night Watchman’s Lullaby',
    titleHi: 'रात्रि की शांत लोरी',
    subtitle: 'A bedtime verse designed to quiet lingering evening thoughts before sleep.',
    subtitleHi: 'सोने से पहले दिनभर के विचारों को विराम देने वाली शांत कविता।',
    moodTag: 'Sleep Wind-Down',
    moodTagHi: 'नींद की तैयारी',
    readTime: '2 min read',
    readTimeHi: '2 मिनट',
    paragraphs: [
      'Fold up the map of everything undone,\nTurn down the lamp beside the quiet bed.\nTomorrow carries its own morning sun;\nTonight belongs to rest, and nothing said.',
      'Let eyelids weigh like petals after rain,\nLet breathing drift into a deeper tide.\nYou stood with courage through the sunlit strain—\nNow sleep, and let the quiet stars abide.',
    ],
    paragraphsHi: [
      'जो काम अधूरे हैं उनका नक्शा अब समेट दो,\nबिस्तर के पास जलता मन का दीया भी बुझा दो।\nकल की सुबह अपनी रोशनी खुद लेकर आएगी,\nआज की रात सिर्फ गहरे विश्राम के नाम लिख दो।',
      'बारिश के बाद पंखुड़ियों की तरह पलकों को झुकने दो,\nसांसों को शांत समुद्र की तरह धीमा बहने दो।\nदिनभर तुमने पूरे साहस से अपना सफर निभाया है—\nअब सो जाओ, और तारों की शांति को भीतर उतरने दो।',
    ],
    breathCue: 'Soften your gaze, relax your tongue from the roof of your mouth, and exhale quietly.',
    breathCueHi: 'अपनी निगाह को नरम करें और एक शांत लंबी सांस बाहर छोड़ें।',
    reflection: 'Rest is where memory, healing, and tomorrow’s resilience are quietly woven.',
    reflectionHi: 'गहरी नींद में ही मन की मरम्मत और अगले दिन का साहस बुना जाता है।',
  },
]

export function PoemsStoriesPanel({ language, onExploreLog }: PoemsStoriesPanelProps) {
  const isHi = language === 'hi'
  const [filter, setFilter] = useState<FilterMode>('all')
  const [selectedId, setSelectedId] = useState<string>(SANCTUARY_PIECES[0].id)
  const [readIds, setReadIds] = useState<Record<string, boolean>>({})
  const [favoriteIds, setFavoriteIds] = useState<Record<string, boolean>>({})
  const [readerSize, setReaderSize] = useState<ReaderSize>('md')

  const filteredPieces = useMemo(() => {
    if (filter === 'all') return SANCTUARY_PIECES
    return SANCTUARY_PIECES.filter((p) => p.kind === filter)
  }, [filter])

  const activePiece =
    filteredPieces.find((p) => p.id === selectedId) || filteredPieces[0] || SANCTUARY_PIECES[0]

  const activeIndex = filteredPieces.findIndex((p) => p.id === activePiece.id)

  const handleSelectPiece = (piece: SanctuaryPiece) => {
    setSelectedId(piece.id)
    onExploreLog(`Opened ${piece.kind}: ${piece.title}`)
  }

  const handleMarkRead = (piece: SanctuaryPiece) => {
    setReadIds((prev) => ({ ...prev, [piece.id]: true }))
    onExploreLog(`Completed calming ${piece.kind}: ${piece.title}`)
  }

  const handleToggleFavorite = (pieceId: string) => {
    setFavoriteIds((prev) => ({ ...prev, [pieceId]: !prev[pieceId] }))
  }

  const handleStep = (dir: -1 | 1) => {
    if (filteredPieces.length <= 1) return
    const nextIdx = (activeIndex + dir + filteredPieces.length) % filteredPieces.length
    handleSelectPiece(filteredPieces[nextIdx])
  }

  const bodyTextClass =
    readerSize === 'sm'
      ? 'text-xs sm:text-sm leading-relaxed'
      : readerSize === 'lg'
        ? 'text-base sm:text-[17px] leading-loose'
        : 'text-sm sm:text-[15px] leading-relaxed'

  const completedCount = Object.values(readIds).filter(Boolean).length

  return (
    <div className="space-y-5">
      {/* Header & Filter Bar */}
      <div className="rounded-[26px] clay-card p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="w-11 h-11 rounded-[14px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? 'तनाव-मुक्त कविताएं और कहानियां' : 'Stress-Relieving Poems & Engaging Stories'}
              </h2>
              <p className="text-xs sm:text-sm text-[#495847] dark:text-[#A8B7A4] mt-0.5 max-w-2xl">
                {isHi
                  ? 'मन को हल्का करने वाली रोचक कहानियां और लयात्मक कविताएं—पढ़ें, गहरी सांस लें और शांत महसूस करें।'
                  : 'Read immersive calming stories and soothing verses crafted to quiet overthinking, soften study or work stress, and settle your breath.'}
              </p>
            </div>
          </div>

          <div className="clay-well px-3.5 py-2 rounded-[14px] text-xs font-semibold text-[#344932] dark:text-[#A8C6A4] inline-flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isHi
                ? `${completedCount}/${SANCTUARY_PIECES.length} पठित`
                : `${completedCount}/${SANCTUARY_PIECES.length} Read`}
            </span>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Sanctuary Reads', labelHi: 'सभी (कहानी व कविता)' },
                { id: 'story', label: 'Engaging Stories', labelHi: 'रोचक कहानियां' },
                { id: 'poem', label: 'Calming Poems', labelHi: 'शांतिदायक कविताएं' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setFilter(tab.id)
                  const firstMatch =
                    tab.id === 'all'
                      ? SANCTUARY_PIECES[0]
                      : SANCTUARY_PIECES.find((x) => x.kind === tab.id)
                  if (firstMatch) setSelectedId(firstMatch.id)
                }}
                className={`px-3.5 py-2 rounded-[13px] text-xs font-semibold cursor-pointer transition-all ${
                  filter === tab.id ? 'clay-btn-primary' : 'clay-btn-secondary'
                }`}
              >
                {isHi ? tab.labelHi : tab.label}
              </button>
            ))}
          </div>

          {/* Reading Font Size Switcher */}
          <div className="clay-well p-1 rounded-[13px] inline-flex items-center gap-1">
            <Type className="w-3.5 h-3.5 mx-1.5 opacity-70" />
            {(['sm', 'md', 'lg'] as const).map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => setReaderSize(sz)}
                aria-label={`Text size ${sz}`}
                className={`px-2.5 py-1 rounded-[9px] text-[11px] font-bold uppercase cursor-pointer transition-all ${
                  readerSize === sz ? 'clay-btn-primary' : 'opacity-70 hover:opacity-100'
                }`}
              >
                {sz === 'sm' ? 'A-' : sz === 'md' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Split Sanctuary: Library List + Immersive Calm Reader */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Library List */}
        <div className="lg:col-span-5 space-y-2.5">
          {filteredPieces.map((piece) => {
            const isSelected = piece.id === activePiece.id
            const isRead = Boolean(readIds[piece.id])
            const isFav = Boolean(favoriteIds[piece.id])
            return (
              <button
                key={piece.id}
                type="button"
                onClick={() => handleSelectPiece(piece)}
                className={`w-full text-left p-4 rounded-[20px] transition-all cursor-pointer ${
                  isSelected
                    ? 'clay-card ring-2 ring-[#5E7D5B] dark:ring-[#A8C6A4]'
                    : 'clay-tile clay-card-interactive'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        piece.kind === 'story'
                          ? 'bg-[#344932]/12 text-[#344932] dark:bg-[#A8C6A4]/18 dark:text-[#CBE2C8]'
                          : 'bg-[#789575]/18 text-[#2B4229] dark:bg-[#789575]/25 dark:text-[#E5E8CE]'
                      }`}
                    >
                      {piece.kind === 'story' ? (
                        <BookOpen className="w-2.5 h-2.5" />
                      ) : (
                        <Feather className="w-2.5 h-2.5" />
                      )}
                      <span>
                        {piece.kind === 'story'
                          ? isHi
                            ? 'कहानी'
                            : 'Story'
                          : isHi
                            ? 'कविता'
                            : 'Poem'}
                      </span>
                    </span>

                    <span className="text-[10px] font-semibold text-[#5E7D5B] dark:text-[#A8C6A4]">
                      {isHi ? piece.moodTagHi : piece.moodTag}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isFav && <Heart className="w-3.5 h-3.5 text-[#C94A4A] fill-[#C94A4A]" />}
                    {isRead && <CheckCircle2 className="w-3.5 h-3.5 text-[#2F6F4E] dark:text-[#8EE0B6]" />}
                  </div>
                </div>

                <h3 className="font-display text-sm sm:text-base font-bold text-[#1B251A] dark:text-[#E5E8CE] mt-2">
                  {isHi ? piece.titleHi : piece.title}
                </h3>
                <p className="text-xs text-[#495847] dark:text-[#A8B7A4] mt-1 line-clamp-2">
                  {isHi ? piece.subtitleHi : piece.subtitle}
                </p>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-medium text-[#5A6C58] dark:text-[#9CB899]">
                  <Clock className="w-3 h-3" />
                  <span>{isHi ? piece.readTimeHi : piece.readTime}</span>
                </div>
              </button>
            )
          })}
        </div>

        {/* Calm Reader Surface */}
        <article className="lg:col-span-7 rounded-[28px] clay-card p-5 sm:p-7 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#789575]/20">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#344932] text-[#E5E8CE] dark:bg-[#A8C6A4] dark:text-[#142013]">
                  {activePiece.kind === 'story'
                    ? isHi
                      ? 'रोचक कहानी'
                      : 'Engaging Story'
                    : isHi
                      ? 'शांतिदायक कविता'
                      : 'Calming Poem'}
                </span>
                <span className="text-xs font-semibold text-[#5E7D5B] dark:text-[#A8C6A4]">
                  {isHi ? activePiece.moodTagHi : activePiece.moodTag} ·{' '}
                  {isHi ? activePiece.readTimeHi : activePiece.readTime}
                </span>
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? activePiece.titleHi : activePiece.title}
              </h3>
              <p className="text-xs sm:text-sm text-[#495847] dark:text-[#A8B7A4]">
                {isHi ? activePiece.subtitleHi : activePiece.subtitle}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleToggleFavorite(activePiece.id)}
              aria-label={isHi ? 'पसंदीदा में जोड़ें' : 'Save favorite'}
              className="clay-btn-secondary p-2.5 rounded-[13px] cursor-pointer shrink-0"
            >
              <Heart
                className={`w-4 h-4 ${
                  favoriteIds[activePiece.id]
                    ? 'text-[#C94A4A] fill-[#C94A4A]'
                    : 'text-[#495847] dark:text-[#A8C6A4]'
                }`}
              />
            </button>
          </div>

          {/* Story Paragraphs or Poetic Stanzas */}
          <div
            className={`space-y-4 text-[#1B251A] dark:text-[#E5E8CE]/95 ${bodyTextClass} ${
              activePiece.kind === 'poem' ? 'italic whitespace-pre-line font-serif sm:px-2' : ''
            }`}
          >
            {(isHi ? activePiece.paragraphsHi : activePiece.paragraphs).map((block, idx) => (
              <p key={`${activePiece.id}-p-${idx}`}>{block}</p>
            ))}
          </div>

          {/* Grounding Breath Cue & Gentle Takeaway */}
          <div className="clay-well rounded-[20px] p-4 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <span className="w-8 h-8 rounded-[10px] clay-orb-sage text-[#142013] flex items-center justify-center shrink-0 mt-0.5">
                <Wind className="w-4 h-4" />
              </span>
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#344932] dark:text-[#A8C6A4]">
                  {isHi ? 'पढ़ने के बाद का विश्राम संकेत' : 'Gentle Breath & Pause Cue'}
                </div>
                <p className="text-xs sm:text-sm font-medium text-[#1B251A] dark:text-[#E5E8CE] mt-0.5">
                  {isHi ? activePiece.breathCueHi : activePiece.breathCue}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-[#789575]/15 text-xs text-[#495847] dark:text-[#A8B7A4]">
              <strong className="text-[#1B251A] dark:text-[#E5E8CE]">
                {isHi ? 'संदेश: ' : 'Takeaway: '}
              </strong>
              {isHi ? activePiece.reflectionHi : activePiece.reflection}
            </div>
          </div>

          {/* Reader Footer Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={() => handleMarkRead(activePiece)}
              className={`px-4 py-2.5 rounded-[14px] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer transition-all ${
                readIds[activePiece.id] ? 'clay-btn-secondary' : 'clay-btn-primary'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {readIds[activePiece.id]
                  ? isHi
                    ? 'पठित के रूप में सहेजा गया'
                    : 'Saved as Read'
                  : isHi
                    ? 'पढ़ना पूरा हुआ'
                    : 'Mark as Read'}
              </span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStep(-1)}
                className="clay-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>{isHi ? 'पिछला' : 'Previous'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleStep(1)}
                className="clay-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
              >
                <span>{isHi ? 'अगला' : 'Next'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
