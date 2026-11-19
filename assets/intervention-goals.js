/* Goal bank for the therapist's intervention plan. Each long-term goal holds short-term goals the
 * therapist can select for the learner. Goals follow what مقطع practises and measures: syllable
 * circles and the rhythm frame for 1–5 syllable words, «الصورة وعدد المقاطع» (counting) and
 * «المقاطع والصورة» (blending), each at easy, moderate and hard difficulty. 80% is the user's achievement criterion,
 * not a published norm. Sources are listed below and in docs/intervention-goals.md. */
((root) => {
    'use strict';
    // This app: name for the report, therapist-mode key, and its progress store.
    const APP = { id: 'taffaha', name: 'مقطع', therapistKey: 'syllables-builder-therapist', unlocksLevels: false, progress: () => root.TaffahaProgress };
    const SOURCES = {
        'asha-ssd': {
            label: 'ASHA Practice Portal: Speech Sound Disorders: Articulation and Phonology',
            url: 'https://www.asha.org/practice-portal/clinical-topics/articulation-and-phonology/',
            note: 'Phonological awareness tasks include "segmentation and blending at the word, onset–rime, syllable, and phonemic levels"; a syllable-structure error pattern is that "Weak syllables are deleted"; practice moves from syllables to "monosyllabic words," then to "multisyllabic words"; "The syllable is used as the building block for practice at more complex levels."'
        },
        'asha-sld': {
            label: 'ASHA Practice Portal: Spoken Language Disorders',
            url: 'https://www.asha.org/practice-portal/clinical-topics/spoken-language-disorders/',
            note: 'Carryover of learned skills "beyond the treatment setting", with practice "in the home and in the community".'
        },
        'gillon-2000': {
            label: 'Gillon, G. T. (2000). The efficacy of phonological awareness intervention for children with spoken language impairment. Language, Speech, and Hearing Services in Schools, 31(2), 126–141.',
            url: 'https://doi.org/10.1044/0161-1461.3102.126',
            note: 'Phonological awareness intervention improved phonological awareness and speech production in 5–7-year-olds with phonological impairment (confirmed from the reference and secondary summaries only).'
        }
    };

    const GOALS = [
        {
            id: 'L1', title: 'تقطيع الكلمة',
            text: 'يقطّع الطفل الكلمة إلى مقاطع بالتصفيق أو بالدوائر.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S1.1', text: 'يقطّع كلمة من مقطع أو مقطعين.', where: 'التدريب · إطار الإيقاع · 1–2 مقطع' },
                { id: 'S1.2', text: 'يقطّع كلمة من 3 مقاطع.', where: 'التدريب · إطار الإيقاع · 3 مقاطع' },
                { id: 'S1.3', text: 'يقطّع كلمة من 4 أو 5 مقاطع.', where: 'التدريب · إطار الإيقاع · 4–5 مقاطع' }
            ]
        },
        {
            id: 'L2', title: 'عدّ المقاطع',
            text: 'يعرف الطفل كم مقطعاً في الكلمة.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S2.1', text: 'يختار عدد المقاطع والفرق كبير بين الخيارين.', where: 'الصورة وعدد المقاطع · سهل' },
                { id: 'S2.2', text: 'يختار عدد المقاطع والفرق مقطعان.', where: 'الصورة وعدد المقاطع · متوسط' },
                { id: 'S2.3', text: 'يختار عدد المقاطع بين عددين متجاورين: «2 أو 3».', where: 'الصورة وعدد المقاطع · صعب' }
            ]
        },
        {
            id: 'L3', title: 'جمع المقاطع',
            text: 'يجمع الطفل المقاطع ويعرف الكلمة.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S3.1', text: 'يسمع المقاطع ويختار الصورة (الصورتان مختلفتان كثيراً).', where: 'المقاطع والصورة · سهل' },
                { id: 'S3.2', text: 'يسمع المقاطع ويختار الصورة (الفرق مقطع واحد).', where: 'المقاطع والصورة · متوسط' },
                { id: 'S3.3', text: 'يسمع المقاطع ويختار الصورة (نفس عدد المقاطع).', where: 'المقاطع والصورة · صعب' }
            ]
        },
        {
            id: 'L4', title: 'قول الكلمة كاملة',
            text: 'يقول الطفل الكلمة الطويلة بكل مقاطعها.',
            sources: ['asha-ssd'],
            short: [
                { id: 'S4.1', text: 'يكرّر الكلمة مقطعاً مقطعاً.', where: 'التدريب · دوائر المقاطع' },
                { id: 'S4.2', text: 'يقول كلمة من 3 مقاطع بدون حذف.', where: 'التدريب · 3 مقاطع' },
                { id: 'S4.3', text: 'يقول كلمة من 4 أو 5 مقاطع بدون حذف.', where: 'التدريب · 4–5 مقاطع' },
                { id: 'S4.4', text: 'يقول مقطعاً مع كل نقرة إيقاع.', where: 'التدريب · إطار الإيقاع' }
            ]
        },
        {
            id: 'L5', title: 'الاستعمال اليومي',
            text: 'يستعمل الطفل المقاطع مع كلمات جديدة وفي كلامه.',
            sources: ['asha-sld', 'gillon-2000'],
            short: [
                { id: 'S5.1', text: 'يقطّع ويعدّ مقاطع كلمات جديدة.', where: 'خارج التطبيق' },
                { id: 'S5.2', text: 'يقول الكلمات الطويلة كاملة في البيت (حسب الأهل).', where: 'رسالة الأهل' },
                { id: 'S5.3', text: 'يتذكّر المهارة بعد أسبوعين بدون تدريب.', where: 'الاختبارين' }
            ]
        }
    ];

    // Ready-made plans: one tap adds their short-term goals to the child's plan.
    const PLANS = [
        { id: 'P1', title: 'بداية', text: 'كلمات قصيرة: تقطيع وعدّ', goals: ["S1.1", "S2.1", "S3.1", "S4.1"] },
        { id: 'P2', title: 'متوسط', text: 'كلمات من 3 مقاطع', goals: ["S1.2", "S2.2", "S3.2", "S4.2"] },
        { id: 'P3', title: 'متقدم', text: 'كلمات طويلة واستعمال يومي', goals: ["S1.3", "S2.3", "S3.3", "S4.3", "S4.4", "S5.2"] }
    ];
    const LEVELS = [20, 40, 60, 80];
    const ACHIEVED = 80;
    const byId = new Map(GOALS.flatMap(goal => goal.short.map(item => [item.id, { ...item, long: goal }])));
    const api = { APP, SOURCES, GOALS, PLANS, LEVELS, ACHIEVED, short: id => byId.get(id) || null };
    if (typeof module !== 'undefined') module.exports = api;
    root.InterventionGoals = api;
})(globalThis);
