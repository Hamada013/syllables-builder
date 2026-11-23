import {installDialogFallback} from './dialogs.js';
import {applyIcons,icon} from './icons.js';
import {loadWords,loadImage,assetURL} from './assetsManager.js';
import {AudioEngine} from './audio.js';
import {readPreferences,savePreferences} from './storage.js';
import {initOffline} from './offline.js';
import {progress as P,TEST_LEVEL} from './progress.js';
import {initProfile,initReports} from './profile-ui.js';
import {LEVELS,pictureChoices,countChoices} from './test-model.js';
installDialogFallback();applyIcons();
const $=id=>document.getElementById(id),engine=new AudioEngine();
const saved=P.active()?P.workspace()||readPreferences():readPreferences(),preferences=saved&&typeof saved==='object'&&!Array.isArray(saved)?saved:{};
const levelNames={easy:'سهل',moderate:'متوسط',hard:'صعب'};
let words=[],index=0,playback=null,libraryCount=3,screen='home',questionSerial=0,answerPending=false,answered=false,feedbackTimer=null;
let level=LEVELS.includes(preferences.testLevel)?preferences.testLevel:'easy';
let testKind=preferences.testKind==='count'?'count':'picture';
let practiceRhythm=preferences.practiceRhythm===true;
let learnedFilter=null,attemptsThisQuestion=0,sessionId=preferences.sessionId||crypto.randomUUID(),resumeAttempt=preferences;

const current=()=>words[index],digits=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const countLabel=count=>count===1?'مقطع واحد':count===2?'مقطعان':digits(count)+' مقاطع';
const group=()=>words.filter(word=>word.syllableCount===current().syllableCount);
const syllablePause=()=>[250,600,1000].includes(Number(preferences.pace))?Number(preferences.pace):600;
const feedbackOpen=()=>$('answer-feedback').hasAttribute('open');
function say(text){$('status').textContent=text;}
function persist(){
 if(current())preferences.lastWord=current().id;
 delete preferences.autoAdvance;delete preferences.imagePrompt;delete preferences.segments;
 Object.assign(preferences,{testLevel:level,testKind,practiceRhythm,screen,testTries:attemptsThisQuestion,sessionId});
 const saved=P.active()?P.saveWorkspace(preferences):savePreferences(preferences);
 if(!saved)say('تعذر حفظ اختياراتك على هذا المتصفح.');
}
function locks(){
 for(const id of ['start-practice','start-test','previous','next','random','original','sequence','rhythm-sequence','toggle-rhythm','test-prompt','open-library'])$(id).disabled=!words.length;
 $('test-prompt').disabled=!words.length||answerPending;
 for(const b of $('test-answers').querySelectorAll('button'))b.disabled=answerPending||answered||feedbackOpen();
}
function stopPlayback(){
 playback?.abort();playback=null;engine.stop();
 for(const el of document.querySelectorAll('.lit,.is-playing'))el.classList.remove('lit','is-playing');
 for(const id of ['original','sequence','rhythm-sequence','test-prompt'])$(id).setAttribute('aria-busy','false');
}
async function runPlayback(action){
 engine.unlock();stopPlayback();say('');const controller=new AbortController();playback=controller;
 try{await action(controller.signal);return !controller.signal.aborted;}
 catch(e){if(e.name!=='AbortError')say(e.message||'تعذر تشغيل الصوت.');return false;}
 finally{if(playback===controller){playback=null;for(const el of document.querySelectorAll('.lit,.is-playing'))el.classList.remove('lit','is-playing');for(const id of ['original','sequence','rhythm-sequence','test-prompt'])$(id).setAttribute('aria-busy','false');}}
}
function gap(ms,signal){
 return new Promise((resolve,reject)=>{
  if(signal.aborted)return reject(new DOMException('Cancelled','AbortError'));
  const finish=()=>{signal.removeEventListener('abort',abort);resolve();},timer=setTimeout(finish,ms);
  const abort=()=>{clearTimeout(timer);signal.removeEventListener('abort',abort);reject(new DOMException('Cancelled','AbortError'));};
  signal.addEventListener('abort',abort,{once:true});
 });
}
async function playSegment(word,i,signal){
 if(signal.aborted)throw new DOMException('Cancelled','AbortError');
 try{await engine.play(assetURL(word.syllableAudio[i]),{signal});}
 catch(e){if(e.name==='AbortError')throw e;throw Error('صوت هذا المقطع غير متوفر بعد.');}
}
function fillSyllables(container,word,blank=false){
 container.dataset.count=word.syllableCount;container.replaceChildren();
 word.syllables.forEach((segment,i)=>{
  const unit=document.createElement(blank?'span':'div'),circle=document.createElement(blank?'span':'button');unit.className='syllable-unit';circle.className='syllable-circle';circle.dataset.index=i;
  circle.textContent=blank?'':segment;
  if(!blank){circle.setAttribute('aria-label','استمع للمقطع '+segment);circle.onclick=()=>runPlayback(async signal=>{circle.classList.add('lit');await playSegment(word,i,signal);});}
  unit.append(circle);container.append(unit);
 });
}
function fillPracticeBeats(word){
 const container=$('practice-beats');container.dataset.count=word.syllableCount;container.replaceChildren();
 word.syllables.forEach((_,i)=>{
  const unit=document.createElement('div'),circle=document.createElement('button');unit.className='syllable-unit';circle.className='syllable-circle metronome-circle';circle.dataset.index=i;
  circle.setAttribute('aria-label','استمع للنبضة '+digits(i+1));
  circle.onclick=()=>runPlayback(async signal=>{circle.classList.add('lit');await engine.beat({signal});});
  unit.append(circle);container.append(unit);
 });
}
async function playSyllables(container,button,word,signal){
 button.classList.add('is-playing');button.setAttribute('aria-busy','true');
 for(let i=0;i<word.syllableCount;i++){
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  const circle=container.querySelector(`[data-index="${i}"]`);circle.classList.add('lit');await playSegment(word,i,signal);circle.classList.remove('lit');
  if(i<word.syllableCount-1)await gap(syllablePause(),signal);
 }
}
function cancelFeedback(){clearTimeout(feedbackTimer);feedbackTimer=null;document.body.classList.remove('feedback-visible');if(feedbackOpen())$('answer-feedback').close();}
$('answer-feedback').addEventListener('close',()=>{if(feedbackOpen())return;clearTimeout(feedbackTimer);feedbackTimer=null;document.body.classList.remove('feedback-visible');for(const el of $('test-answers').querySelectorAll('.is-wrong'))el.classList.remove('is-wrong');locks();});
function showFeedback(correct,choice){
 window.SessionHomework?.record({activity:testKind==='count'?'الصورة وعدد المقاطع':'المقاطع والصورة',key:current().id,label:current().label,syllables:current().syllables,count:current().syllableCount,kind:'assessment',domain:testKind,correct:Number(correct),total:1});
 P.record({id:crypto.randomUUID(),word:current(),mode:testKind,level,correct,firstTry:attemptsThisQuestion===0,completed:correct,sessionId});
 if(!correct&&route&&attemptsThisQuestion===0)route.failed.add(current().id);
 void (correct?window.VocPrompts?.praise():window.VocPrompts?.retry());
 attemptsThisQuestion++;preferences.questionCompleted=correct;persist();
 stopPlayback();answered=correct;choice.classList.add(correct?'is-correct':'is-wrong');
 $('answer-feedback').dataset.result=correct?'correct':'wrong';$('feedback-symbol').innerHTML=icon(correct?'check':'close');$('feedback-text').textContent=correct?'أحسنت!':'حاول مرة أخرى';
 const serial=questionSerial;document.body.classList.add('feedback-visible');$('answer-feedback').showModal();locks();
 feedbackTimer=setTimeout(()=>{
  feedbackTimer=null;$('answer-feedback').close();
  if(serial===questionSerial&&screen==='test'&&correct){if(route)void routeNext();else navigate(1);}
 },correct?1100:900);
}
async function selectPicture(word,button){
 if(answerPending||answered||feedbackOpen())return;
 answerPending=true;locks();const serial=questionSerial,target=current();
 const completed=await runPlayback(async signal=>{button.classList.add('is-playing');await engine.play(assetURL(word.audio),{signal});});
 if(serial!==questionSerial||screen!=='test')return;
 answerPending=false;if(completed)showFeedback(word.id===target.id,button);locks();
}
function beatDots(count){
 const dots=document.createElement('span');dots.className='beat-dots';dots.dataset.count=count;dots.setAttribute('aria-hidden','true');
 for(let i=0;i<count;i++){const dot=document.createElement('span');dot.className='beat-dot';dots.append(dot);}return dots;
}
async function playBeats(count,card,signal,word=null){
 const dots=card.querySelectorAll('.beat-dot,.metronome-circle');
 // Each practice beat occupies its spoken syllable's duration, then uses the
 // same pause as the syllable frame. Short clicks alone ran too quickly.
 const durations=word?await Promise.all(word.syllableAudio.map(async asset=>{
  try{return 1000*await engine.duration(assetURL(asset),{signal});}
  catch(e){if(e.name==='AbortError')throw e;return 350;}
 })):null;
 for(let i=0;i<count;i++){
  if(signal.aborted)throw new DOMException('Cancelled','AbortError');
  const started=performance.now();
  dots[i].classList.add('lit');try{
   await engine.beat({signal});
   const remaining=(durations?.[i]||0)-(performance.now()-started);
   if(remaining>0)await gap(remaining,signal);
  }finally{dots[i].classList.remove('lit');}
  if(i<count-1)await gap(word?syllablePause():440,signal);
 }
}
async function selectCount(count,card){
 if(answerPending||answered||feedbackOpen())return;
 answerPending=true;locks();const serial=questionSerial,target=current();
 const completed=await runPlayback(signal=>playBeats(count,card,signal));
 if(serial!==questionSerial||screen!=='test')return;
 answerPending=false;if(completed)showFeedback(count===target.syllableCount,card);locks();
}
function renderTest(){
 const word=current(),picturePrompt=testKind==='count';
 $('test-screen').dataset.wordId=word.id;$('test-screen').dataset.kind=testKind;$('test-screen').dataset.level=level;
 $('test-title').textContent=testKind==='picture'?'اختر الصورة':'كم مقطعًا تسمع؟';
 $('test-syllables').hidden=picturePrompt;$('test-picture').hidden=!picturePrompt;
 if(picturePrompt){$('test-syllables').replaceChildren();loadImage($('test-word-image'),word.image,'صورة الكلمة');}
 else fillSyllables($('test-syllables'),word,true);
 $('test-answers').replaceChildren();$('test-answers').className='test-answers '+(testKind==='count'?'count-answers':'picture-answers');
 if(testKind==='picture'){
  for(const option of pictureChoices(words,word,level)){
   const b=document.createElement('button'),image=document.createElement('img');b.className='picture-answer';b.dataset.wordId=option.id;b.setAttribute('aria-label',option.label);loadImage(image,option.image,option.label);b.append(image);b.onclick=()=>selectPicture(option,b);$('test-answers').append(b);
  }
 }else{
  for(const count of countChoices(word.syllableCount,level)){
   const card=document.createElement('button');card.className='count-answer count-choice';card.dataset.count=count;
   card.setAttribute('aria-label','اختيار '+countLabel(count)+' والاستماع إلى الإيقاع');card.append(beatDots(count));card.onclick=()=>selectCount(count,card);
   $('test-answers').append(card);
  }
 }
}
function updateToolbar(){
 $('open-profile').hidden=screen!=='home';$('open-report').hidden=screen!=='home';document.querySelector('.contact-footer').hidden=screen!=='home';
 $('go-home').hidden=screen==='home';$('open-library').hidden=screen==='home';
 $('toggle-rhythm').hidden=screen!=='practice';$('start-route').hidden=screen!=='practice';$('toggle-rhythm').setAttribute('aria-pressed',String(practiceRhythm));
 for(const id of ['open-mode','open-level'])$(id).hidden=screen!=='test';
 const modeLabel=testKind==='count'?'الصورة وعدد المقاطع':'المقاطع والصورة';
 $('open-mode').innerHTML=icon(testKind==='count'?'picture':'count');$('open-mode').setAttribute('aria-label','نوع الاختبار: '+modeLabel);$('open-mode').title='نوع الاختبار: '+modeLabel;
 $('open-level').innerHTML=icon(level);$('open-level').setAttribute('aria-label','المستوى: '+levelNames[level]);$('open-level').title='المستوى: '+levelNames[level];
 const categoryLabel=screen==='test'?'اختيار عدد المقاطع':'اختيار كلمة حسب عدد المقاطع';$('open-library').setAttribute('aria-label',categoryLabel);$('open-library').title=categoryLabel;
}
function renderCurrent(){
 stopPlayback();cancelFeedback();questionSerial++;answerPending=false;answered=false;say('');
 attemptsThisQuestion=resumeAttempt?.lastWord===current().id&&resumeAttempt?.testKind===testKind&&resumeAttempt?.testLevel===level?Number(resumeAttempt.testTries)||0:0;resumeAttempt=null;preferences.questionCompleted=false;
 const word=current(),siblings=group(),position=digits(siblings.findIndex(w=>w.id===word.id)+1)+' / '+digits(siblings.length);persist();
 if(screen!=='home')window.SessionHomework?.record({activity:screen==='practice'?(practiceRhythm?'تدريب إيقاع المقاطع':'تدريب الكلمات والمقاطع'):testKind==='count'?'الصورة وعدد المقاطع':'المقاطع والصورة',key:word.id,label:word.label,syllables:word.syllables,count:word.syllableCount});
 if(screen==='practice'){
  $('practice-screen').dataset.rhythm=String(practiceRhythm);$('rhythm-frame').hidden=!practiceRhythm;
  $('word-label').textContent=word.label;$('category').textContent=countLabel(word.syllableCount);$('position').textContent=position;loadImage($('word-image'),word.image,word.label);fillSyllables($('syllables'),word);
  if(practiceRhythm)fillPracticeBeats(word);else $('practice-beats').replaceChildren();
  $('original').setAttribute('aria-label','استمع للكلمة: '+word.label);
 }else if(screen==='test'){$('test-position').textContent=position;renderTest();}
 updateToolbar();locks();
}
function activateScreen(next){
 if(['practice','test'].includes(next)&&!P.active()){window.TaffahaProfile?.open();next='home';}
 const before=screen;screen=['practice','test'].includes(next)?next:'home';
 if(screen==='test'&&before!=='test'&&!resumeAttempt)sessionId=crypto.randomUUID();
 stopPlayback();cancelFeedback();questionSerial++;answerPending=false;answered=false;
 for(const name of ['home','practice','test'])$(name+'-screen').hidden=screen!==name;
 $('word-navigation').hidden=screen==='home';document.body.dataset.screen=screen;
 updateToolbar();if(words.length&&screen!=='home')renderCurrent();else{say('');locks();if(words.length)persist();}
}
function goTo(next){activateScreen(next);const hash=screen==='home'?'':'#'+screen;if(location.hash!==hash)history.pushState(null,'',location.pathname+location.search+hash);}
window.addEventListener('hashchange',()=>{if(words.length)activateScreen(location.hash.slice(1));});
$('start-practice').onclick=()=>goTo('practice');$('start-test').onclick=()=>goTo('test');$('go-home').onclick=()=>goTo('home');
document.querySelector('.brand').onclick=e=>{e.preventDefault();goTo('home');};
function navigate(step){
 const siblings=group(),position=siblings.findIndex(w=>w.id===current().id),next=siblings[(position+step+siblings.length)%siblings.length];index=words.findIndex(w=>w.id===next.id);renderCurrent();
}
// ---- Route: practice → «المقاطع والصورة» → repeat missed → «الصورة وعدد المقاطع» → repeat missed ----
// Five words from the current syllable group, starting with the current word. It runs by itself;
// any manual tap (next, home, library, mode, level…) stops it.
const ROUTE_SIZE=5;let route=null;
function cancelRoute(){if(!route)return;route=null;document.body.classList.remove('route-active');if($('route-repeat').open)$('route-repeat').close();}
function routeIndex(){index=words.findIndex(w=>w.id===route.ids[route.pos]);}
async function startRoute(){
 const siblings=group(),start=siblings.findIndex(w=>w.id===current().id);
 route={ids:Array.from({length:Math.min(ROUTE_SIZE,siblings.length)},(_,i)=>siblings[(start+i)%siblings.length].id),stage:'practice',pos:0,failed:new Set()};
 document.body.classList.add('route-active');const own=route;
 if(screen!=='practice')goTo('practice');
 for(;route===own&&route.pos<route.ids.length;route.pos++){
  routeIndex();renderCurrent();const word=current();
  // The route always shows the beat circles: picture and word, then its syllables, then one beat per syllable.
  $('practice-screen').dataset.rhythm='true';$('rhythm-frame').hidden=false;fillPracticeBeats(word);
  await runPlayback(async signal=>{$('original').classList.add('is-playing');await engine.play(assetURL(word.audio),{signal});await gap(500,signal);await playSyllables($('syllables'),$('sequence'),word,signal);await gap(500,signal);await playBeats(word.syllableCount,$('practice-beats'),signal,word);await gap(1000,signal);});
 }
 if(route===own)startRouteTest('picture');
}
function startRouteTest(kind){
 testKind=kind;route.stage=kind;route.pos=0;route.failed=new Set();sessionId=crypto.randomUUID();
 if(P.active())level=TEST_LEVEL[P.level()];
 routeIndex();if(screen!=='test')goTo('test');else renderCurrent();
}
async function routeNext(){
 if(!route)return;route.pos++;
 if(route.pos<route.ids.length){routeIndex();renderCurrent();return;}
 const own=route,missed=[...route.failed];
 await repeatWords(missed);if(route!==own)return;
 if(route.stage==='picture'){startRouteTest('count');return;}
 cancelRoute();say('خلصنا! برافو عليك');void window.VocPrompts?.say('done-1');
}
// Each missed word once, big, with its word, then 1 second. No buttons; Escape stops the route.
async function repeatWords(ids){
 if(!ids.length)return;const dialog=$('route-repeat'),own=route;dialog.showModal();
 for(const id of ids){
  if(route!==own)break;const word=words.find(w=>w.id===id);
  loadImage($('route-repeat-image'),word.image,word.label);$('route-repeat-label').textContent=word.label;
  const figure=dialog.querySelector('figure');figure.classList.remove('route-in');void figure.offsetWidth;figure.classList.add('route-in');
  await runPlayback(async signal=>{await engine.play(assetURL(word.audio),{signal});await gap(1000,signal);});
 }
 if(dialog.open)dialog.close();
}
$('route-repeat').addEventListener('cancel',()=>{stopPlayback();cancelRoute();});
$('start-route').onclick=()=>{cancelRoute();void startRoute();};
for(const id of ['previous','next','random','go-home','open-library','open-mode','open-level','start-practice','start-test','toggle-rhythm'])$(id).addEventListener('click',cancelRoute,true);
$('previous').onclick=()=>navigate(-1);$('next').onclick=()=>navigate(1);$('random').onclick=()=>navigate(1+Math.floor(Math.random()*(group().length-1)));
$('original').onclick=()=>runPlayback(async signal=>{$('original').classList.add('is-playing');$('original').setAttribute('aria-busy','true');await engine.play(assetURL(current().audio),{signal});});
$('sequence').onclick=()=>runPlayback(signal=>playSyllables($('syllables'),$('sequence'),current(),signal));
$('rhythm-sequence').onclick=()=>runPlayback(async signal=>{$('rhythm-sequence').classList.add('is-playing');$('rhythm-sequence').setAttribute('aria-busy','true');const word=current();await playBeats(word.syllableCount,$('practice-beats'),signal,word);});
$('toggle-rhythm').onclick=()=>{practiceRhythm=!practiceRhythm;renderCurrent();};
function playTest(){return runPlayback(async signal=>{
 if(testKind==='count'){$('test-prompt').classList.add('is-playing');$('test-prompt').setAttribute('aria-busy','true');await engine.play(assetURL(current().audio),{signal});}
 else await playSyllables($('test-syllables'),$('test-prompt'),current(),signal);
});}
$('test-prompt').onclick=playTest;
$('open-mode').onclick=()=>{
 for(const b of document.querySelectorAll('#mode-dialog [data-mode]'))b.setAttribute('aria-pressed',String(b.dataset.mode===testKind));
 $('mode-dialog').showModal();
};
for(const b of document.querySelectorAll('#mode-dialog [data-mode]'))b.onclick=()=>{testKind=b.dataset.mode;$('mode-dialog').close();renderCurrent();};
$('open-level').onclick=()=>{
 const descriptions=testKind==='picture'?{easy:'فرق مقطعين أو أكثر',moderate:'فرق مقطع واحد',hard:'عدد المقاطع نفسه'}:{easy:'فرق كبير بين العددين',moderate:'فرق مقطعين',hard:'فرق مقطع واحد'};
 for(const b of document.querySelectorAll('#level-dialog button[data-level]')){b.setAttribute('aria-pressed',String(b.dataset.level===level));b.querySelector('small').textContent=descriptions[b.dataset.level];}
 $('level-dialog').showModal();
};
for(const b of document.querySelectorAll('#level-dialog button[data-level]'))b.onclick=()=>{level=b.dataset.level;$('level-dialog').close();renderCurrent();};
for(const button of document.querySelectorAll('[data-close]'))button.onclick=()=>button.closest('dialog').close();
for(const dialog of document.querySelectorAll('dialog:not(#answer-feedback)'))dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
function background(){stopPlayback();cancelFeedback();cancelRoute();}
document.addEventListener('visibilitychange',()=>{if(document.hidden)background();});window.addEventListener('pagehide',background);
function renderLibrary(){
 const q=$('search').value.trim();$('word-library').replaceChildren();
 for(const [i,word]of words.entries())if(word.syllableCount===libraryCount&&word.label.includes(q)&&(!learnedFilter||P.learned(word.id,learnedFilter))){
  const b=document.createElement('button'),image=document.createElement('img'),label=document.createElement('span');image.loading='lazy';loadImage(image,word.image);label.textContent=word.label;b.append(image,label);b.setAttribute('aria-current',String(i===index));b.onclick=()=>{index=i;$('library-dialog').close();if(screen==='home')goTo('practice');else renderCurrent();};$('word-library').append(b);
 }
 if(!$('word-library').children.length)$('word-library').textContent=learnedFilter?'لا توجد كلمات مكتسبة هنا بعد.':'لا توجد كلمات مطابقة.';
 for(const button of document.querySelectorAll('[data-learned-mode]'))button.setAttribute('aria-pressed',String(button.dataset.learnedMode===learnedFilter));
 for(const b of $('category-filters').children)b.setAttribute('aria-pressed',String(Number(b.dataset.count)===libraryCount));
}
for(const button of document.querySelectorAll('[data-learned-mode]'))button.onclick=()=>{learnedFilter=learnedFilter===button.dataset.learnedMode?null:button.dataset.learnedMode;renderLibrary();};
for(const button of document.querySelectorAll('[data-open-learned]'))button.onclick=()=>{learnedFilter=button.dataset.openLearned;libraryCount=current()?.syllableCount||3;$('search').value='';renderLibrary();$('library-dialog').showModal();};
$('search').oninput=renderLibrary;$('open-library').onclick=()=>{
 if(screen==='test'){
  for(const b of $('test-categories').children)b.setAttribute('aria-pressed',String(Number(b.dataset.count)===current().syllableCount));
  $('test-category-dialog').showModal();
 }else{libraryCount=current().syllableCount;$('search').value='';renderLibrary();$('library-dialog').showModal();}
};
window.TaffahaApp={go:goTo,test:kind=>{testKind=kind;goTo('test');}};
window.addEventListener('taffaha-profile-open',()=>{background();cancelRoute();});
window.addEventListener('taffaha-level-change',()=>{level=TEST_LEVEL[P.level()];if(screen==='test')renderCurrent();else persist();});
window.addEventListener('suite-navigation-open',background);
window.addEventListener('taffaha-profile-beforechange',()=>{background();});
window.addEventListener('taffaha-profile-change',()=>{
 const saved=P.workspace()||{};for(const key of Object.keys(preferences))delete preferences[key];Object.assign(preferences,saved);
 level=P.active()?TEST_LEVEL[P.level()]:LEVELS.includes(saved.testLevel)?saved.testLevel:'easy';testKind=saved.testKind==='count'?'count':'picture';practiceRhythm=saved.practiceRhythm===true;
 index=Math.max(0,words.findIndex(word=>word.id===(saved.lastWord||'voc-6-1')));sessionId=saved.sessionId||crypto.randomUUID();resumeAttempt=saved;attemptsThisQuestion=Number(saved.testTries)||0;learnedFilter=null;
 if(saved.questionCompleted&&words.length){const siblings=group();index=words.indexOf(siblings[(siblings.indexOf(current())+1)%siblings.length]);resumeAttempt=null;attemptsThisQuestion=0;preferences.questionCompleted=false;}
 goTo('home');window.AppNavigation?.register();
});
async function init(){
 initProfile();
 try{
  if(P.active())level=TEST_LEVEL[P.level()];
  words=await loadWords();index=words.findIndex(w=>w.id===(preferences.lastWord||'voc-6-1'));if(index<0)index=0;
  if(preferences.questionCompleted){const siblings=group();index=words.indexOf(siblings[(siblings.indexOf(current())+1)%siblings.length]);resumeAttempt=null;}
  for(let n=1;n<=5;n++){const b=document.createElement('button');b.textContent=String(n);b.dataset.count=n;b.setAttribute('aria-label',countLabel(n));b.onclick=()=>{libraryCount=n;renderLibrary();};$('category-filters').append(b);}
  for(let n=1;n<=5;n++){
   const b=document.createElement('button');b.textContent=String(n);b.dataset.count=n;b.setAttribute('aria-label',countLabel(n));
   b.onclick=()=>{index=words.findIndex(w=>w.syllableCount===n);$('test-category-dialog').close();renderCurrent();};$('test-categories').append(b);
  }
  initReports(words);
  activateScreen(location.hash.slice(1)||preferences.screen);
  window.dispatchEvent(new Event('taffaha-ready'));
 }catch(e){say(e.message);$('word-label').textContent='تعذر تحميل البطاقات';}
 initOffline();
}
init();
