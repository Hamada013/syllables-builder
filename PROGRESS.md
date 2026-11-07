# Child progress and reports

There are no child accounts. The app keeps one learner per device, created automatically on first launch, so there is nothing to sign in to, switch or delete. Progress is stored in this browser's local storage under `syllables-builder-v1`. There is no cloud account or cross-device sync.

The learner's last word, test kind, level, rhythm and unfinished question are restored after reopening. Failed storage writes show an error and retain the current in-memory work.

The two skills are independent:

- `count`: الصورة وعدد المقاطع
- `picture`: المقاطع والصورة

A word is learned in a skill when its latest completed question was correct on the first attempt. Wrong answers and retries remain in the accuracy totals. Retrying after a reload does not erase the earlier mistake. Practice and interrupted audio do not award mastery. The two learned icons on the home screen and word library filter the respective collections; the full word bank remains available.

The report has six periods, separate accuracy and acquisition for each test, acquisition by syllable count, and a local PDF download.

Checks:

```sh
npm test
npm run test:browser
```
