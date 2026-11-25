import type {
  AssessmentResultSnapshot,
  AssessmentToolId,
  DailyCheckInMood,
  FunctionalImpactLevel,
  GuidedActivityId,
  RelaxationProfile,
  SleepQuality,
} from '../types';

export interface ScreeningInstrumentMeta {
  id: AssessmentToolId;
  code: string;
  title: string;
  titleHi: string;
  subtitle: string;
  subtitleHi: string;
  questionCount: number;
  timeframe: string;
  timeframeHi: string;
  options: { value: number; label: string; labelHi: string }[];
  questions: { en: string; hi: string; reversed?: boolean }[];
}

const LIKERT_4_FREQUENCY = [
  { value: 0, label: 'Not at all', labelHi: 'बिल्कुल नहीं' },
  { value: 1, label: 'Several days', labelHi: 'कई दिन' },
  { value: 2, label: 'More than half the days', labelHi: 'आधे से ज़्यादा दिन' },
  { value: 3, label: 'Nearly every day', labelHi: 'लगभग हर दिन' },
];

const WHO5_OPTIONS = [
  { value: 0, label: 'At no time', labelHi: 'कभी नहीं' },
  { value: 1, label: 'Some of the time', labelHi: 'कुछ समय' },
  { value: 2, label: 'Less than half of the time', labelHi: 'आधे से कम समय' },
  { value: 3, label: 'More than half of the time', labelHi: 'आधे से अधिक समय' },
  { value: 4, label: 'Most of the time', labelHi: 'अधिकांश समय' },
  { value: 5, label: 'All of the time', labelHi: 'हर समय' },
];

const PSS10_OPTIONS = [
  { value: 0, label: 'Never', labelHi: 'कभी नहीं' },
  { value: 1, label: 'Almost never', labelHi: 'लगभग कभी नहीं' },
  { value: 2, label: 'Sometimes', labelHi: 'कभी-कभी' },
  { value: 3, label: 'Fairly often', labelHi: 'काफी बार' },
  { value: 4, label: 'Very often', labelHi: 'बहुत बार' },
];

export const SCREENING_INSTRUMENTS: Record<AssessmentToolId, ScreeningInstrumentMeta> = {
  phq9: {
    id: 'phq9',
    code: 'PHQ-9',
    title: 'Depression Screening',
    titleHi: 'अवसाद स्क्रीनिंग (PHQ-9)',
    subtitle: '9 standardized questions · Past 2 weeks',
    subtitleHi: '9 मानक प्रश्न · पिछले 2 सप्ताह',
    questionCount: 9,
    timeframe: 'Over the last 2 weeks, how often have you been bothered by:',
    timeframeHi: 'पिछले 2 सप्ताह में, आप कितनी बार इनसे परेशान रहे हैं:',
    options: LIKERT_4_FREQUENCY,
    questions: [
      {
        en: 'Little interest or pleasure in doing things',
        hi: 'काम करने में कम रुचि या आनंद महसूस होना',
      },
      {
        en: 'Feeling down, depressed, or hopeless',
        hi: 'उदास, निराश या हताश महसूस करना',
      },
      {
        en: 'Trouble falling or staying asleep, or sleeping too much',
        hi: 'नींद आने या सोने में कठिनाई, या बहुत अधिक सोना',
      },
      {
        en: 'Feeling tired or having little energy',
        hi: 'थकान महसूस करना या ऊर्जा की कमी',
      },
      {
        en: 'Poor appetite or overeating',
        hi: 'भूख कम लगना या बहुत अधिक खाना',
      },
      {
        en: 'Feeling bad about yourself — or that you are a failure or have let yourself or family down',
        hi: 'खुद के बारे में बुरा या असफल महसूस करना',
      },
      {
        en: 'Trouble concentrating on things, such as reading or watching content',
        hi: 'पढ़ने या किसी काम पर ध्यान केंद्रित करने में कठिनाई',
      },
      {
        en: 'Moving or speaking slowly, or being fidgety and restless',
        hi: 'बहुत धीरे चलना/बोलना या बहुत बेचैन रहना',
      },
      {
        en: 'Thoughts that you would be better off dead, or of hurting yourself in some way',
        hi: 'खुद को नुकसान पहुँचाने या निराशा के गंभीर विचार आना',
      },
    ],
  },
  gad7: {
    id: 'gad7',
    code: 'GAD-7',
    title: 'Anxiety Screening',
    titleHi: 'चिंता स्क्रीनिंग (GAD-7)',
    subtitle: '7 standardized questions · Past 2 weeks',
    subtitleHi: '7 मानक प्रश्न · पिछले 2 सप्ताह',
    questionCount: 7,
    timeframe: 'Over the last 2 weeks, how often have you been bothered by:',
    timeframeHi: 'पिछले 2 सप्ताह में, आप कितनी बार इनसे परेशान रहे हैं:',
    options: LIKERT_4_FREQUENCY,
    questions: [
      {
        en: 'Feeling nervous, anxious, or on edge',
        hi: 'घबराहट, चिंता या बेचैनी महसूस करना',
      },
      {
        en: 'Not being able to stop or control worrying',
        hi: 'चिंता को रोक या नियंत्रित न कर पाना',
      },
      {
        en: 'Worrying too much about different things',
        hi: 'अलग-अलग बातों की बहुत अधिक चिंता करना',
      },
      {
        en: 'Trouble relaxing',
        hi: 'आराम या शांत होने में कठिनाई',
      },
      {
        en: 'Being so restless that it is hard to sit still',
        hi: 'इतनी बेचैनी कि स्थिर बैठना कठिन हो',
      },
      {
        en: 'Becoming easily annoyed or irritable',
        hi: 'आसानी से चिड़चिड़ा या नाराज़ हो जाना',
      },
      {
        en: 'Feeling afraid, as if something awful might happen',
        hi: 'ऐसा डर लगना जैसे कुछ बुरा होने वाला हो',
      },
    ],
  },
  who5: {
    id: 'who5',
    code: 'WHO-5',
    title: 'Wellbeing Index',
    titleHi: 'स्वास्थ्य सूचकांक (WHO-5)',
    subtitle: '5 standardized positive wellbeing items · Past 2 weeks',
    subtitleHi: '5 सकारात्मक कल्याण प्रश्न · पिछले 2 सप्ताह',
    questionCount: 5,
    timeframe: 'Over the last two weeks, how often have you felt:',
    timeframeHi: 'पिछले दो सप्ताह में, आपने कितनी बार ऐसा महसूस किया:',
    options: WHO5_OPTIONS,
    questions: [
      {
        en: 'I have felt cheerful and in good spirits',
        hi: 'मैंने प्रसन्न और अच्छे मनोभाव में महसूस किया है',
      },
      {
        en: 'I have felt calm and relaxed',
        hi: 'मैंने शांत और तनावमुक्त महसूस किया है',
      },
      {
        en: 'I have felt active and vigorous',
        hi: 'मैंने सक्रिय और ऊर्जावान महसूस किया है',
      },
      {
        en: 'I woke up feeling fresh and rested',
        hi: 'मैं सुबह तरोताज़ा और आराम महसूस करते हुए जागा',
      },
      {
        en: 'My daily life has been filled with things that interest me',
        hi: 'मेरा दैनिक जीवन दिलचस्प चीज़ों से भरा रहा है',
      },
    ],
  },
  pss10: {
    id: 'pss10',
    code: 'PSS-10',
    title: 'Perceived Stress Scale',
    titleHi: 'तनाव पैमाना (PSS-10)',
    subtitle: '10 standardized questions · Past month',
    subtitleHi: '10 मानक प्रश्न · पिछला महीना',
    questionCount: 10,
    timeframe: 'In the last month, how often have you:',
    timeframeHi: 'पिछले महीने में, कितनी बार आपने:',
    options: PSS10_OPTIONS,
    questions: [
      {
        en: 'Been upset because of something that happened unexpectedly',
        hi: 'किसी अप्रत्याशित घटना के कारण परेशान हुए',
      },
      {
        en: 'Felt that you were unable to control the important things in your life',
        hi: 'महसूस किया कि आप जीवन की महत्वपूर्ण चीज़ों को नियंत्रित नहीं कर पा रहे',
      },
      {
        en: 'Felt nervous and stressed',
        hi: 'घबराहट और तनाव महसूस किया',
      },
      {
        en: 'Felt confident about your ability to handle your personal problems',
        hi: 'अपनी व्यक्तिगत समस्याओं को संभालने की क्षमता पर आत्मविश्वास महसूस किया',
        reversed: true,
      },
      {
        en: 'Felt that things were going your way',
        hi: 'महसूस किया कि चीज़ें आपके अनुसार चल रही हैं',
        reversed: true,
      },
      {
        en: 'Found that you could not cope with all the things that you had to do',
        hi: 'पाया कि आप अपने सभी कार्यों का सामना नहीं कर पा रहे',
      },
      {
        en: 'Been able to control irritations in your life',
        hi: 'अपने जीवन की चिड़चिड़ाहट को नियंत्रित कर पाए',
        reversed: true,
      },
      {
        en: 'Felt that you were on top of things',
        hi: 'महसूस किया कि आप स्थितियों पर पूरी तरह नियंत्रण में हैं',
        reversed: true,
      },
      {
        en: 'Been angered because of things that were outside of your control',
        hi: 'नियंत्रण से बाहर की बातों पर क्रोधित हुए',
      },
      {
        en: 'Felt difficulties were piling up so high that you could not overcome them',
        hi: 'महसूस किया कि कठिनाइयाँ इतनी बढ़ गईं कि पार पाना मुश्किल लगा',
      },
    ],
  },
};

export function scorePHQ9(answers: number[]): { score: number; range: string; item9Flag: boolean } {
  const score = answers.reduce((sum, v) => sum + (v || 0), 0);
  const item9Flag = (answers[8] || 0) > 0;
  let range = 'Minimal Range';
  if (score >= 20) range = 'Severe Range';
  else if (score >= 15) range = 'Moderately Severe';
  else if (score >= 10) range = 'Moderate Range';
  else if (score >= 5) range = 'Mild Range';
  return { score, range, item9Flag };
}

export function scoreGAD7(answers: number[]): { score: number; range: string } {
  const score = answers.reduce((sum, v) => sum + (v || 0), 0);
  let range = 'Minimal Range';
  if (score >= 15) range = 'Severe Range';
  else if (score >= 10) range = 'Moderate Range';
  else if (score >= 5) range = 'Mild Range';
  return { score, range };
}

export function scoreWHO5(answers: number[]): { percent: number; range: string } {
  const raw = answers.reduce((sum, v) => sum + (v || 0), 0);
  const percent = Math.min(100, Math.max(0, raw * 4));
  let range = 'Good';
  if (percent < 28) range = 'Low Wellbeing';
  else if (percent <= 50) range = 'Moderate';
  return { percent, range };
}

export function scorePSS10(answers: number[]): { score: number; range: string } {
  const items = SCREENING_INSTRUMENTS.pss10.questions;
  const score = items.reduce((sum, item, idx) => {
    const val = answers[idx] ?? 0;
    return sum + (item.reversed ? 4 - val : val);
  }, 0);
  let range = 'Low Level';
  if (score >= 27) range = 'High Level';
  else if (score >= 14) range = 'Moderate Level';
  return { score, range };
}

export interface SuggestedSoundRecommendation {
  trackId: 'cortisol_reset_432hz_bansuri' | 'tibetan_cleaning_energy' | 'locked_in_40hz_gamma'
  title: string
  titleHi: string
  categoryLabel: RelaxationProfile['preferredAudio']
  categoryId: RelaxationProfile['preferredAudioCategory']
  reason: string
  reasonHi: string
}

export function getSuggestedSoundTherapy(params: {
  dailyMood?: DailyCheckInMood
  stressRating?: number
  sleepQuality?: SleepQuality
  phq9Score?: number
  gad7Score?: number
  pss10Score?: number
  stressLabel?: 'Low' | 'Medium' | 'High'
  sleepHours?: number
}): SuggestedSoundRecommendation {
  const numericStress =
    params.stressRating ??
    (params.stressLabel === 'High' ? 8 : params.stressLabel === 'Medium' ? 5 : 2)
  const poorSleep =
    params.sleepQuality === 'Poor' ||
    (typeof params.sleepHours === 'number' && params.sleepHours < 6.2)
  const lowMood =
    params.dailyMood === 'Very Low' ||
    params.dailyMood === 'Low' ||
    (params.phq9Score ?? 0) >= 10
  const highCortisol =
    numericStress >= 7 || (params.gad7Score ?? 0) >= 10 || (params.pss10Score ?? 0) >= 20

  if (highCortisol) {
    return {
      trackId: 'cortisol_reset_432hz_bansuri',
      title: '432Hz Bamboo Bansuri Flute',
      titleHi: '432Hz बांसुरी और तानपुरा राग',
      categoryLabel: 'Sound Baths',
      categoryId: 'sound_baths',
      reason: 'Matched to elevated stress/anxiety to lower cortisol and calm racing thoughts.',
      reasonHi: 'बढ़े हुए तनाव व चिंता को शांत करने और कॉर्टिसोल संतुलित करने के लिए अनुशंसित।',
    }
  }

  if (poorSleep || lowMood) {
    return {
      trackId: 'tibetan_cleaning_energy',
      title: 'Tibetan Singing Bowls & Chimes',
      titleHi: 'तिब्बती सिंगिंग बाउल नाद',
      categoryLabel: 'Sound Baths',
      categoryId: 'sound_baths',
      reason: 'Matched to low mood or light sleep recovery for emotional & physical restoration.',
      reasonHi: 'कम ऊर्जा, भारी मन या कमज़ोर नींद को गहरा आराम देने के लिए अनुशंसित।',
    }
  }

  return {
    trackId: 'locked_in_40hz_gamma',
    title: '40Hz Gamma Brainwave Focus',
    titleHi: '40Hz गामा ब्रेनवेव फोकस',
    categoryLabel: 'Binaural Beats',
    categoryId: 'binaural_beats',
    reason: 'Matched to your balanced state to sustain calm focus and deep cognitive flow.',
    reasonHi: 'आपके संतुलित स्तर के अनुरूप गहरी एकाग्रता और शांत प्रवाह के लिए अनुशंसित।',
  }
}

export function deriveRelaxationProfile(params: {
  dailyMood: DailyCheckInMood
  stressRating: number
  sleepQuality: SleepQuality
  phq9Score?: number
  gad7Score?: number
  pss10Score?: number
  existing?: RelaxationProfile
}): RelaxationProfile {
  const physicalTension: RelaxationProfile['physicalTension'] =
    params.stressRating >= 7 || (params.gad7Score ?? 0) >= 10
      ? 'High'
      : params.stressRating >= 4
        ? 'Moderate'
        : 'Low'

  const busyThoughts: RelaxationProfile['busyThoughts'] =
    (params.gad7Score ?? 0) >= 8 || (params.pss10Score ?? 0) >= 18 || params.dailyMood === 'Very Low'
      ? 'High'
      : params.stressRating >= 4
        ? 'Moderate'
        : 'Low'

  const breathingComfort: RelaxationProfile['breathingComfort'] =
    params.stressRating >= 8 ? 'Tight' : params.stressRating >= 4 ? 'Moderate' : 'Comfortable'

  const sleepRelaxation: RelaxationProfile['sleepRelaxation'] =
    params.sleepQuality === 'Poor' || params.sleepQuality === 'Okay' || (params.phq9Score ?? 0) >= 10
      ? 'Needed'
      : 'Optional'

  const autoSound = getSuggestedSoundTherapy({
    dailyMood: params.dailyMood,
    stressRating: params.stressRating,
    sleepQuality: params.sleepQuality,
    phq9Score: params.phq9Score,
    gad7Score: params.gad7Score,
    pss10Score: params.pss10Score,
  })

  return {
    physicalTension,
    busyThoughts,
    breathingComfort,
    sleepRelaxation,
    preferredAudio: autoSound.categoryLabel,
    preferredAudioCategory: autoSound.categoryId,
    sessionDuration:
      params.existing?.sessionDuration ?? (params.stressRating >= 6 ? '5–10 min' : '2–5 min'),
  }
}

export function buildCalmPlanRecommendations(
  profile: RelaxationProfile,
  snapshot: Pick<
    AssessmentResultSnapshot,
    'stressRating' | 'phq9Score' | 'gad7Score' | 'pss10Score' | 'sleepQuality'
  >
): GuidedActivityId[] {
  const ranked: { id: GuidedActivityId; priority: number }[] = [
    {
      id: 'breathing',
      priority:
        profile.breathingComfort === 'Tight' || snapshot.stressRating >= 6 ? 10 : 8,
    },
    {
      id: 'pmr',
      priority:
        profile.physicalTension === 'High' || (snapshot.gad7Score ?? 0) >= 10 ? 9 : 6,
    },
    {
      id: 'imagery',
      priority:
        profile.sleepRelaxation === 'Needed' || snapshot.sleepQuality === 'Poor' ? 8 : 5,
    },
    {
      id: 'mindfulness',
      priority:
        profile.busyThoughts === 'High' || (snapshot.pss10Score ?? 0) >= 14 ? 8 : 7,
    },
  ];

  return ranked.sort((a, b) => b.priority - a.priority).map((r) => r.id);
}

export function computeCompositeWellnessScore(params: {
  dailyMood: DailyCheckInMood;
  stressRating: number;
  sleepHours: number;
  phq9Score?: number;
  gad7Score?: number;
  who5Percent?: number;
  pss10Score?: number;
  functionalImpact: FunctionalImpactLevel;
  typingVarianceMs?: number;
  voiceStressLevel?: 'Low' | 'Mild' | 'Moderate' | 'Elevated';
}): number {
  const moodBase: Record<DailyCheckInMood, number> = {
    'Very Low': 48,
    Low: 60,
    Okay: 72,
    Good: 84,
    Great: 92,
  };
  let score = moodBase[params.dailyMood];
  score -= params.stressRating * 1.6;
  if (params.sleepHours >= 7) score += 5;
  else if (params.sleepHours < 6) score -= 7;

  if (typeof params.who5Percent === 'number') {
    score = score * 0.65 + params.who5Percent * 0.35;
  }
  if (typeof params.phq9Score === 'number') {
    score -= params.phq9Score * 0.65;
  }
  if (typeof params.gad7Score === 'number') {
    score -= params.gad7Score * 0.65;
  }
  if (typeof params.pss10Score === 'number') {
    score -= Math.max(0, params.pss10Score - 10) * 0.4;
  }
  if (params.functionalImpact === 'Very difficult') score -= 5;
  if (params.functionalImpact === 'Extremely difficult') score -= 9;

  if (typeof params.typingVarianceMs === 'number') {
    if (params.typingVarianceMs > 65) score -= 3;
    else if (params.typingVarianceMs <= 35) score += 2;
  }
  if (params.voiceStressLevel === 'Elevated') score -= 4;
  else if (params.voiceStressLevel === 'Moderate') score -= 2;
  else if (params.voiceStressLevel === 'Low') score += 2;

  return Math.max(28, Math.min(96, Math.round(score)));
}
