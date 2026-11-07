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
            id: 'L1', title: 'تقطيع الكلمة إلى مقاطع',
            text: 'سيقطّع الطفل الكلمة إلى مقاطعها بالتصفيق أو بالضغط على دائرة لكل مقطع.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S1.1', text: 'يصفّق أو يضغط دائرة لكل مقطع في كلمات من مقطع أو مقطعين بدقة 80%.', where: 'التدريب · إطار الإيقاع · 1–2 مقطع' },
                { id: 'S1.2', text: 'يصفّق أو يضغط دائرة لكل مقطع في كلمات من 3 مقاطع بدقة 80%.', where: 'التدريب · إطار الإيقاع · 3 مقاطع' },
                { id: 'S1.3', text: 'يصفّق أو يضغط دائرة لكل مقطع في كلمات من 4 أو 5 مقاطع بدقة 80%.', where: 'التدريب · إطار الإيقاع · 4–5 مقاطع' }
            ]
        },
        {
            id: 'L2', title: 'عدّ المقاطع',
            text: 'سيعرف الطفل عدد مقاطع الكلمة المسموعة.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S2.1', text: 'يختار بطاقة عدد المقاطع الصحيح بعد سماع الكلمة، بفرق كبير بين الخيارين، بدقة 80%.', where: 'الصورة وعدد المقاطع · سهل' },
                { id: 'S2.2', text: 'يختار بطاقة عدد المقاطع الصحيح بفرق مقطعين بين الخيارين بدقة 80%.', where: 'الصورة وعدد المقاطع · متوسط' },
                { id: 'S2.3', text: 'يختار بطاقة عدد المقاطع الصحيح بين عددين متجاورين (مثل 2 و3) بدقة 80%.', where: 'الصورة وعدد المقاطع · صعب' }
            ]
        },
        {
            id: 'L3', title: 'دمج المقاطع',
            text: 'سيدمج الطفل المقاطع المسموعة ليتعرّف الكلمة.',
            sources: ['asha-ssd', 'gillon-2000'],
            short: [
                { id: 'S3.1', text: 'يسمع المقاطع ويختار صورة الكلمة من بين صورتين تختلفان بمقطعين على الأقل بدقة 80%.', where: 'المقاطع والصورة · سهل' },
                { id: 'S3.2', text: 'يسمع المقاطع ويختار صورة الكلمة من بين صورتين تختلفان بمقطع واحد بدقة 80%.', where: 'المقاطع والصورة · متوسط' },
                { id: 'S3.3', text: 'يسمع المقاطع ويختار صورة الكلمة من بين صورتين بنفس عدد المقاطع بدقة 80%.', where: 'المقاطع والصورة · صعب' }
            ]
        },
        {
            id: 'L4', title: 'نطق الكلمات متعددة المقاطع',
            text: 'سينطق الطفل الكلمات متعددة المقاطع كاملة دون حذف أي مقطع.',
            sources: ['asha-ssd'],
            short: [
                { id: 'S4.1', text: 'يكرّر الكلمة مقطعاً مقطعاً بعد سماع كل مقطع بدقة 80%.', where: 'التدريب · دوائر المقاطع' },
                { id: 'S4.2', text: 'يقول كلمات من 3 مقاطع كاملة دون حذف مقطع بدقة 80%.', where: 'التدريب · 3 مقاطع' },
                { id: 'S4.3', text: 'يقول كلمات من 4 أو 5 مقاطع كاملة دون حذف مقطع بدقة 80%.', where: 'التدريب · 4–5 مقاطع' },
                { id: 'S4.4', text: 'يقول الكلمة بإيقاع منتظم، مقطعاً مع كل نقرة، بدقة 80%.', where: 'التدريب · إطار الإيقاع' }
            ]
        },
        {
            id: 'L5', title: 'التعميم والمحافظة',
            text: 'سيستخدم الطفل مهارات المقاطع مع كلمات جديدة وفي الكلام اليومي.',
            sources: ['asha-sld', 'gillon-2000'],
            short: [
                { id: 'S5.1', text: 'يقطّع ويعدّ مقاطع كلمات جديدة ليست في التطبيق بدقة 80%.', where: 'خارج التطبيق' },
                { id: 'S5.2', text: 'يقول كلمات متعددة المقاطع كاملة في الكلام اليومي، حسب ملاحظة الأهل، في 80% من الفرص.', where: 'رسالة الأهل' },
                { id: 'S5.3', text: 'يحافظ على تقطيع ودمج المقاطع بعد أسبوعين دون تدريب بدقة 80%.', where: 'الاختبارين' }
            ]
        }
    ];

    const LEVELS = [20, 40, 60, 80];
    const ACHIEVED = 80;
    const byId = new Map(GOALS.flatMap(goal => goal.short.map(item => [item.id, { ...item, long: goal }])));
    const api = { APP, SOURCES, GOALS, LEVELS, ACHIEVED, short: id => byId.get(id) || null };
    if (typeof module !== 'undefined') module.exports = api;
    root.InterventionGoals = api;
})(globalThis);
