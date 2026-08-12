const PLAYLIST_ID = 'PLJODkeX4uSus';
const $ = (selector) => document.querySelector(selector);
const ui = {clock:$('#clock'),settingsTrigger:$('#settings-trigger'),settings:$('#shortcut-settings'),settingsClose:$('#settings-close'),shortcutKeys:[...document.querySelectorAll('[data-shortcut]')],musicShortcut:$('#music-shortcut'),timeShortcut:$('#time-shortcut'),shortcutMessage:$('#shortcut-message'),shortcutReset:$('#shortcut-reset'),flipDisplay:$('#flip-display'),timeOutput:$('#time-output'),modeWheel:$('#mode-wheel'),wheelTrack:$('#wheel-track'),modes:[...document.querySelectorAll('[data-mode]')],timerWheelShell:$('#timer-wheel-shell'),timerWheel:$('#timer-wheel'),timerWheelTrack:$('#timer-wheel-track'),actions:$('#time-actions'),primary:$('#time-primary'),secondary:$('#time-secondary'),presetButtons:[...document.querySelectorAll('[data-seconds]')],disc:$('#disc'),cover:$('#cover'),title:$('#track-title'),artist:$('#track-artist'),seek:$('#seek'),seekFill:$('#seek-fill'),seekKnob:$('#seek-knob'),current:$('#current-time'),duration:$('#duration'),shuffle:$('#shuffle'),repeat:$('#repeat'),sleepDuration:$('#sleep-duration'),sleepStatus:$('#sleep-status'),optionsButton:$('#playback-options-button'),options:$('#playback-options'),previous:$('#previous'),play:$('#play'),next:$('#next'),listButton:$('#playlist-button'),list:$('#playlist'),items:$('#playlist-items'),trackCount:$('#track-count'),notice:$('#local-notice')};
let ytPlayer, playlist = [], currentIndex = 0, shuffle = true, repeatCurrent = false, sleepDeadline = 0, sleepTimer, timer;
let timeMode='clock',stopwatchMs=0,stopwatchStarted=0,stopwatchRunning=false,timerMs=300000,timerStarted=0,timerRunning=false,lastFlipValue='';
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const SHORTCUT_DEFAULTS={music:'KeyM',time:'KeyT'};
const SHORTCUT_STORAGE='golden-hour-shortcuts-v1';
const modifierOrder=['Control','Alt','Shift','Meta'];
let recordingShortcut=null;
function isValidShortcut(value){if(typeof value!=='string'||!value||value.length>=80)return false;const parts=value.split('+'),codes=parts.filter(part=>!modifierOrder.includes(part));return codes.length===1&&parts.length===new Set(parts).size&&/^(Key[A-Z]|Digit[0-9]|F([1-9]|1[0-2])|Space|Enter|Escape|Tab|Backspace|Delete|Home|End|PageUp|PageDown|Arrow(Up|Down|Left|Right)|Bracket(Left|Right)|Semicolon|Quote|Comma|Period|Slash|Backslash|Minus|Equal|Backquote)$/.test(codes[0])}
function loadShortcuts(){try{const saved=JSON.parse(localStorage.getItem(SHORTCUT_STORAGE)||'{}'),music=isValidShortcut(saved?.music)?saved.music:SHORTCUT_DEFAULTS.music,time=isValidShortcut(saved?.time)?saved.time:SHORTCUT_DEFAULTS.time;return music===time?{...SHORTCUT_DEFAULTS}:{music,time}}catch{return{...SHORTCUT_DEFAULTS}}}
let shortcuts=loadShortcuts();
function shortcutParts(event){const parts=[];if(event.ctrlKey)parts.push('Control');if(event.altKey)parts.push('Alt');if(event.shiftKey)parts.push('Shift');if(event.metaKey)parts.push('Meta');const key=event.code;if(!['ControlLeft','ControlRight','AltLeft','AltRight','ShiftLeft','ShiftRight','MetaLeft','MetaRight'].includes(key))parts.push(key);return parts}
function normalizeShortcut(parts){const modifiers=modifierOrder.filter(key=>parts.includes(key)),code=parts.find(part=>!modifierOrder.includes(part));return code?[...modifiers,code].join('+'):''}
function shortcutLabel(value){return value.split('+').map(part=>part==='Control'?'Ctrl':part==='Meta'?'⌘':part==='Alt'?'Alt':part==='Shift'?'Shift':part.startsWith('Key')?part.slice(3):part.startsWith('Digit')?part.slice(5):part==='Space'?'Space':part.replace(/(Arrow|Bracket)/,'')).join(' + ')}
function renderShortcuts(){ui.musicShortcut.textContent=shortcutLabel(shortcuts.music);ui.timeShortcut.textContent=shortcutLabel(shortcuts.time)}
function setSettings(open){ui.settings.hidden=!open;ui.settingsTrigger.setAttribute('aria-expanded',String(open));if(open)ui.settingsClose.focus();else{recordingShortcut=null;ui.shortcutKeys.forEach(button=>button.classList.remove('is-recording'));ui.shortcutMessage.textContent=''}}
ui.settingsTrigger.addEventListener('click',()=>setSettings(ui.settings.hidden));ui.settingsClose.addEventListener('click',()=>{setSettings(false);ui.settingsTrigger.focus()});
ui.shortcutKeys.forEach(button=>button.addEventListener('click',()=>{recordingShortcut=button.dataset.shortcut;ui.shortcutKeys.forEach(item=>item.classList.toggle('is-recording',item===button));ui.shortcutMessage.textContent=`Press the new ${recordingShortcut==='music'?'music':'time tool'} shortcut…`}));
ui.shortcutReset.addEventListener('click',()=>{shortcuts={...SHORTCUT_DEFAULTS};let persisted=true;try{localStorage.removeItem(SHORTCUT_STORAGE)}catch{persisted=false}recordingShortcut=null;ui.shortcutKeys.forEach(button=>button.classList.remove('is-recording'));renderShortcuts();ui.shortcutMessage.textContent=persisted?'Default shortcuts restored.':'Defaults are active for this session; browser storage could not be cleared.'});
function activateMusic(){if(!window.YT?.PlayerState||!ytPlayer?.getPlayerState)return false;const state=ytPlayer.getPlayerState();if(state===YT.PlayerState.PLAYING)ytPlayer.pauseVideo();else ytPlayer.playVideo();return true}
function activateTimeTool(){if(timeMode==='clock')return false;ui.primary.click();return true}
function eventShortcut(event){return normalizeShortcut(shortcutParts(event))}
document.addEventListener('keydown',event=>{
  if(event.repeat)return;
  if(recordingShortcut){
    event.preventDefault();event.stopPropagation();
    if(event.key==='Escape'){recordingShortcut=null;ui.shortcutKeys.forEach(button=>button.classList.remove('is-recording'));ui.shortcutMessage.textContent='Shortcut change cancelled.';return}
    const value=eventShortcut(event);if(!value)return;
    const other=recordingShortcut==='music'?'time':'music';
    if(value===shortcuts[other]){ui.shortcutMessage.textContent=`${shortcutLabel(value)} is already used for ${other==='music'?'music':'the time tool'}.`;return}
    shortcuts[recordingShortcut]=value;let persisted=true;try{localStorage.setItem(SHORTCUT_STORAGE,JSON.stringify(shortcuts))}catch{persisted=false}renderShortcuts();ui.shortcutMessage.textContent=persisted?`Shortcut saved as ${shortcutLabel(value)}.`:`${shortcutLabel(value)} is active for this session; browser storage is unavailable.`;recordingShortcut=null;ui.shortcutKeys.forEach(button=>button.classList.remove('is-recording'));return
  }
  if(event.key==='Escape'&&!ui.settings.hidden){event.preventDefault();setSettings(false);ui.settingsTrigger.focus();return}
  const target=event.target;if(target instanceof HTMLInputElement||target instanceof HTMLTextAreaElement||target?.isContentEditable)return;
  const value=eventShortcut(event);if(value===shortcuts.music){event.preventDefault();activateMusic()}else if(value===shortcuts.time){event.preventDefault();activateTimeTool()}
});
renderShortcuts();

function formatTime(seconds){if(!Number.isFinite(seconds))return'0:00';const m=Math.floor(seconds/60);return`${m}:${String(Math.floor(seconds%60)).padStart(2,'0')}`}
function clockValue(){const now=new Date();return[String(now.getHours()).padStart(2,'0'),String(now.getMinutes()).padStart(2,'0'),String(now.getSeconds()).padStart(2,'0')]}
function elapsedValue(ms){const total=Math.max(0,Math.floor(ms/1000));return[String(Math.floor(total/3600)).padStart(2,'0'),String(Math.floor(total%3600/60)).padStart(2,'0'),String(total%60).padStart(2,'0')]}
function makeDigit(value,index){const unit=document.createElement('span');unit.className='flip-unit';unit.dataset.index=index;unit.innerHTML=`<span class="flip-card"><span class="card-half card-top"><span class="digit-glyph">${value}</span></span><span class="card-half card-bottom"><span class="digit-glyph">${value}</span></span><span class="flip-leaf flip-front"><span class="digit-glyph">${value}</span><span class="panel-shadow"></span></span><span class="flip-leaf flip-back"><span class="digit-glyph">${value}</span><span class="panel-highlight"></span><span class="panel-shadow"></span></span></span>`;return unit}
function buildFlipDisplay(values){ui.flipDisplay.replaceChildren();values.join('').split('').forEach((value,index)=>{if(index===2||index===4){const colon=document.createElement('b');colon.className='flip-colon';colon.textContent=':';ui.flipDisplay.append(colon)}ui.flipDisplay.append(makeDigit(value,index))});lastFlipValue=values.join('')}
function setFaceValue(face,value){face.querySelector('.digit-glyph').textContent=value}
function renderFlip(values){const next=values.join('');if(!ui.flipDisplay.children.length){buildFlipDisplay(values);return}const units=[...ui.flipDisplay.querySelectorAll('.flip-unit')];next.split('').forEach((value,index)=>{if(value===lastFlipValue[index])return;const card=units[index].querySelector('.flip-card'),top=card.querySelector('.card-top'),bottom=card.querySelector('.card-bottom'),front=card.querySelector('.flip-front'),back=card.querySelector('.flip-back'),previous=lastFlipValue[index];card._finishFlip?.();if(reduceMotion){[top,bottom,front,back].forEach(face=>setFaceValue(face,value));return}
    // Correct mechanical stack while the flap is moving:
    // stationary background = next top + previous bottom;
    // rotating panels = previous front + next back.
    setFaceValue(top,value);setFaceValue(bottom,previous);setFaceValue(front,previous);setFaceValue(back,value);
    const finish=event=>{if(event&&event.target!==back)return;back.removeEventListener('animationend',finish);card._finishFlip=null;if(!card.isConnected)return;[top,bottom,front,back].forEach(face=>setFaceValue(face,value));card.classList.remove('is-flipping')};
    card._finishFlip=()=>finish();back.addEventListener('animationend',finish);card.classList.remove('is-flipping');void card.offsetWidth;card.classList.add('is-flipping')});lastFlipValue=next;ui.timeOutput.value=values.join(':')}
function currentTimeValues(){if(timeMode==='clock')return clockValue();if(timeMode==='stopwatch'){const ms=stopwatchRunning?stopwatchMs+performance.now()-stopwatchStarted:stopwatchMs;return elapsedValue(ms)}const ms=timerRunning?Math.max(0,timerMs-(performance.now()-timerStarted)):timerMs;if(timerRunning&&ms<=0){timerRunning=false;timerMs=0;ui.primary.textContent='Start'}return elapsedValue(ms)}
function updateClock(){const now=new Date();ui.clock.textContent=new Intl.DateTimeFormat([], {weekday:'short',month:'short',day:'numeric'}).format(now);renderFlip(currentTimeValues())}
function positionWheel(selectedIndex,instant=false){ui.modeWheel.classList.toggle('no-motion',instant);ui.modes.forEach((button,index)=>{const distance=index===selectedIndex?0:(index-selectedIndex+ui.modes.length)%ui.modes.length===1?1:-1;button.classList.remove('is-active','is-prev','is-next','is-far-prev','is-far-next');button.classList.add(distance===0?'is-active':distance<0?'is-prev':'is-next');const active=distance===0;button.setAttribute('aria-selected',String(active))});ui.modeWheel.setAttribute('aria-activedescendant',ui.modes[selectedIndex].id);if(instant)requestAnimationFrame(()=>ui.modeWheel.classList.remove('no-motion'))}
function revealTimerWheel(show){if(!show){ui.timerWheelShell.hidden=true;return}const selected=ui.presetButtons.findIndex(button=>button.classList.contains('is-active'));ui.timerWheel.classList.add('no-motion');selectDuration(selected<0?1:selected);ui.timerWheelShell.hidden=false;void ui.timerWheel.offsetWidth;requestAnimationFrame(()=>ui.timerWheel.classList.remove('no-motion'))}
function selectMode(mode,instant=false){timeMode=mode;const index=ui.modes.findIndex(button=>button.dataset.mode===mode);positionWheel(index,instant);ui.actions.hidden=mode==='clock';revealTimerWheel(mode==='timer');ui.secondary.textContent='Reset';ui.primary.textContent=mode==='stopwatch'?(stopwatchRunning?'Pause':'Start'):(timerRunning?'Pause':'Start');buildFlipDisplay(currentTimeValues());updateClock()}
let suppressModeClick=false;
ui.modes.forEach(button=>button.addEventListener('click',()=>{if(!suppressModeClick)selectMode(button.dataset.mode)}));
function stepMode(direction){const index=ui.modes.findIndex(button=>button.dataset.mode===timeMode),next=(index+direction+ui.modes.length)%ui.modes.length;selectMode(ui.modes[next].dataset.mode)}
let lastWheelAt=0;
ui.modeWheel.addEventListener('wheel',event=>{event.preventDefault();const now=performance.now();if(now-lastWheelAt<220)return;lastWheelAt=now;stepMode(event.deltaY>0?1:-1)},{passive:false});
ui.modeWheel.addEventListener('keydown',event=>{if(['ArrowDown','ArrowRight'].includes(event.key)){event.preventDefault();stepMode(1)}else if(['ArrowUp','ArrowLeft'].includes(event.key)){event.preventDefault();stepMode(-1)}else if(event.key==='Home'){event.preventDefault();selectMode('clock')}else if(event.key==='End'){event.preventDefault();selectMode('timer')}});
let activePointer=null,dragStartY=0,dragLastY=0,dragLastAt=0,dragVelocity=0;
ui.modeWheel.addEventListener('pointerdown',event=>{if(activePointer!==null)return;activePointer=event.pointerId;dragStartY=dragLastY=event.clientY;dragLastAt=performance.now();dragVelocity=0;ui.modeWheel.classList.add('is-dragging');ui.modeWheel.setPointerCapture(event.pointerId)});
ui.modeWheel.addEventListener('pointermove',event=>{if(event.pointerId!==activePointer)return;const now=performance.now(),dy=event.clientY-dragLastY;dragVelocity=dy/Math.max(1,now-dragLastAt);dragLastY=event.clientY;dragLastAt=now;ui.wheelTrack.style.transform=`translateY(${Math.max(-34,Math.min(34,(event.clientY-dragStartY)*.42))}px)`});
function endWheelDrag(event){if(event.pointerId!==activePointer)return;const delta=event.clientY-dragStartY,projected=delta+dragVelocity*90;ui.modeWheel.classList.remove('is-dragging');ui.wheelTrack.style.transform='';activePointer=null;if(Math.abs(delta)>5){suppressModeClick=true;setTimeout(()=>{suppressModeClick=false},0)}if(Math.abs(projected)>22)stepMode(projected<0?1:-1)}
ui.modeWheel.addEventListener('pointerup',endWheelDrag);ui.modeWheel.addEventListener('pointercancel',endWheelDrag);
ui.modeWheel.addEventListener('lostpointercapture',event=>{if(event.pointerId!==activePointer)return;ui.modeWheel.classList.remove('is-dragging');ui.wheelTrack.style.transform='';activePointer=null});
ui.primary.addEventListener('click',()=>{if(timeMode==='stopwatch'){if(stopwatchRunning){stopwatchMs+=performance.now()-stopwatchStarted;stopwatchRunning=false}else{stopwatchStarted=performance.now();stopwatchRunning=true}ui.primary.textContent=stopwatchRunning?'Pause':'Start'}else if(timeMode==='timer'){if(timerRunning){timerMs=Math.max(0,timerMs-(performance.now()-timerStarted));timerRunning=false}else if(timerMs>0){timerStarted=performance.now();timerRunning=true}ui.primary.textContent=timerRunning?'Pause':'Start'}updateClock()});
ui.secondary.addEventListener('click',()=>{if(timeMode==='stopwatch'){stopwatchRunning=false;stopwatchMs=0}else{timerRunning=false;timerMs=Number(ui.timerWheelTrack.querySelector('.is-active')?.dataset.seconds||300)*1000}ui.primary.textContent='Start';buildFlipDisplay(currentTimeValues())});
function selectDuration(index){const count=ui.presetButtons.length,normalized=(index+count)%count;ui.presetButtons.forEach((button,i)=>{let distance=i-normalized;if(distance>count/2)distance-=count;if(distance<-count/2)distance+=count;button.className=distance===0?'is-active':distance===-1?'is-prev':distance===1?'is-next':distance<0?'is-far-prev':'is-far-next';button.setAttribute('aria-selected',String(distance===0))});const selected=ui.presetButtons[normalized];ui.timerWheel.setAttribute('aria-activedescendant',selected.id);timerRunning=false;timerMs=Number(selected.dataset.seconds)*1000;ui.primary.textContent='Start';buildFlipDisplay(currentTimeValues())}
let suppressDurationClick=false;
ui.presetButtons.forEach((button,index)=>button.addEventListener('click',()=>{if(!suppressDurationClick)selectDuration(index)}));
function stepDuration(direction){const index=ui.presetButtons.findIndex(button=>button.classList.contains('is-active'));selectDuration(index+direction)}
let durationWheelAt=0;
ui.timerWheel.addEventListener('wheel',event=>{event.preventDefault();const now=performance.now();if(now-durationWheelAt<220)return;durationWheelAt=now;stepDuration(event.deltaY>0?1:-1)},{passive:false});
ui.timerWheel.addEventListener('keydown',event=>{if(['ArrowDown','ArrowRight'].includes(event.key)){event.preventDefault();stepDuration(1)}else if(['ArrowUp','ArrowLeft'].includes(event.key)){event.preventDefault();stepDuration(-1)}});
let durationPointer=null,durationStartY=0,durationLastY=0,durationLastAt=0,durationVelocity=0;
ui.timerWheel.addEventListener('pointerdown',event=>{if(durationPointer!==null)return;durationPointer=event.pointerId;durationStartY=durationLastY=event.clientY;durationLastAt=performance.now();durationVelocity=0;ui.timerWheel.classList.add('is-dragging');ui.timerWheel.setPointerCapture(event.pointerId)});
ui.timerWheel.addEventListener('pointermove',event=>{if(event.pointerId!==durationPointer)return;const now=performance.now();durationVelocity=(event.clientY-durationLastY)/Math.max(1,now-durationLastAt);durationLastY=event.clientY;durationLastAt=now;ui.timerWheelTrack.style.transform=`translateY(${Math.max(-34,Math.min(34,(event.clientY-durationStartY)*.42))}px)`});
function endDurationDrag(event){if(event.pointerId!==durationPointer)return;const delta=event.clientY-durationStartY,projected=delta+durationVelocity*90;ui.timerWheel.classList.remove('is-dragging');ui.timerWheelTrack.style.transform='';durationPointer=null;if(Math.abs(delta)>5){suppressDurationClick=true;setTimeout(()=>{suppressDurationClick=false},0)}if(Math.abs(projected)>22)stepDuration(projected<0?1:-1)}
ui.timerWheel.addEventListener('pointerup',endDurationDrag);ui.timerWheel.addEventListener('pointercancel',endDurationDrag);ui.timerWheel.addEventListener('lostpointercapture',event=>{if(event.pointerId!==durationPointer)return;ui.timerWheel.classList.remove('is-dragging');ui.timerWheelTrack.style.transform='';durationPointer=null});
function thumbnail(id){return`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}

async function loadMetadata(id,index){try{const response=await fetch(`/api/metadata?id=${encodeURIComponent(id)}`);if(!response.ok)return;const data=await response.json(),row=ui.items.children[index];if(row){row.querySelector('strong').textContent=data.title;row.querySelector('small').textContent=data.author}}catch{}}
function renderPlaylist(){ui.items.replaceChildren();playlist.forEach((id,index)=>{const li=document.createElement('li');if(index===currentIndex)li.className='is-current';const button=document.createElement('button');button.type='button';button.dataset.index=index;button.innerHTML=`<img src="${thumbnail(id)}" alt="" loading="lazy"><span><strong>Loading title…</strong><small>Loading artist…</small></span>`;button.addEventListener('click',()=>loadIndex(index,true));li.append(button);ui.items.append(li);loadMetadata(id,index)});ui.trackCount.textContent=`${playlist.length} stops`}
function updateCurrentRow(){[...ui.items.children].forEach((li,index)=>li.classList.toggle('is-current',index===currentIndex));const row=ui.items.children[currentIndex];row?.scrollIntoView({block:'nearest'})}
function refreshMetadata(){if(!ytPlayer?.getVideoData)return;const data=ytPlayer.getVideoData();const id=data.video_id||playlist[currentIndex];ui.title.textContent=data.title||`Track ${currentIndex+1}`;ui.artist.textContent=data.author||'YouTube playlist';if(id){ui.cover.src=thumbnail(id);const row=ui.items.children[currentIndex];if(row){row.querySelector('strong').textContent=data.title||`Track ${currentIndex+1}`;row.querySelector('small').textContent=data.author||'YouTube playlist'}}document.title=`${ui.title.textContent} — Golden Hour Radio`}
function loadIndex(index,play=true){if(!playlist.length)return;currentIndex=(index+playlist.length)%playlist.length;ytPlayer.playVideoAt(currentIndex);if(!play)ytPlayer.pauseVideo();updateCurrentRow();setTimeout(refreshMetadata,700)}
function nextTrack(){if(!playlist.length)return;if(repeatCurrent){ytPlayer.seekTo(0,true);ytPlayer.playVideo();return}if(shuffle){let next=currentIndex;while(playlist.length>1&&next===currentIndex)next=Math.floor(Math.random()*playlist.length);loadIndex(next)}else loadIndex(currentIndex+1)}
function syncProgress(){if(!ytPlayer?.getCurrentTime)return;const current=ytPlayer.getCurrentTime()||0,duration=ytPlayer.getDuration()||0,pct=duration?current/duration*100:0;ui.current.textContent=formatTime(current);ui.duration.textContent=formatTime(duration);ui.seekFill.style.width=`${pct}%`;ui.seekKnob.style.left=`${pct}%`}
function setOptions(open){ui.options.hidden=!open;ui.optionsButton.setAttribute('aria-expanded',String(open))}
function updateOptionIndicator(){ui.optionsButton.classList.toggle('is-on',shuffle||repeatCurrent||Boolean(sleepDeadline))}
function updateSleepStatus(){if(!sleepDeadline){ui.sleepStatus.textContent='Off';return}const minutes=Math.max(1,Math.ceil((sleepDeadline-Date.now())/60000));ui.sleepStatus.textContent=`${minutes} min remaining`}
function setSleepTimer(minutes){clearInterval(sleepTimer);sleepDeadline=minutes?Date.now()+minutes*60000:0;if(sleepDeadline){sleepTimer=setInterval(()=>{if(Date.now()>=sleepDeadline){clearInterval(sleepTimer);sleepDeadline=0;ui.sleepDuration.value='0';ytPlayer?.pauseVideo();updateSleepStatus();updateOptionIndicator()}else updateSleepStatus()},1000)}updateSleepStatus();updateOptionIndicator()}

function initializeYouTube(){
  if(ytPlayer || !window.YT?.Player)return;
  ytPlayer=new YT.Player('yt-player',{height:'1',width:'1',playerVars:{playsinline:1,controls:0,disablekb:1,rel:0,listType:'playlist',list:PLAYLIST_ID,origin:location.origin},events:{onReady:event=>{playlist=event.target.getPlaylist()||[];currentIndex=event.target.getPlaylistIndex()||0;renderPlaylist();ui.play.disabled=false;refreshMetadata();timer=setInterval(syncProgress,500)},onStateChange:event=>{const playing=event.data===YT.PlayerState.PLAYING;ui.play.classList.toggle('is-playing',playing);ui.play.setAttribute('aria-label',playing?'Pause':'Play');ui.disc.classList.toggle('is-playing',playing);if(playing)refreshMetadata();if(event.data===YT.PlayerState.ENDED)nextTrack()},onError:()=>{ui.artist.textContent='This track is unavailable — try next'}}})
}

function loadYouTubeAPI(){
  window.onYouTubeIframeAPIReady=initializeYouTube;
  if(window.YT?.Player){initializeYouTube();return}
  const script=document.createElement('script');
  script.src='https://www.youtube.com/iframe_api';
  script.async=true;
  script.onerror=()=>{ui.artist.textContent='YouTube could not load — check your connection';ui.items.innerHTML='<li class="loading-row">Playlist could not load.</li>'};
  document.head.append(script)
}

ui.play.addEventListener('click',()=>{if(location.protocol==='file:'){ui.notice.hidden=false;return}activateMusic()});
ui.previous.addEventListener('click',()=>loadIndex(currentIndex-1));ui.next.addEventListener('click',nextTrack);
ui.optionsButton.addEventListener('click',()=>setOptions(ui.options.hidden));
ui.shuffle.addEventListener('click',()=>{shuffle=!shuffle;ui.shuffle.setAttribute('aria-checked',String(shuffle));updateOptionIndicator()});
ui.repeat.addEventListener('click',()=>{repeatCurrent=!repeatCurrent;ui.repeat.setAttribute('aria-checked',String(repeatCurrent));updateOptionIndicator()});
ui.sleepDuration.addEventListener('change',()=>setSleepTimer(Number(ui.sleepDuration.value)));
document.addEventListener('pointerdown',event=>{if(!ui.options.hidden&&!ui.options.contains(event.target)&&event.target!==ui.optionsButton&&!ui.optionsButton.contains(event.target))setOptions(false)});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!ui.options.hidden){setOptions(false);ui.optionsButton.focus()}});
ui.listButton.addEventListener('click',()=>{const open=ui.list.classList.toggle('is-open');ui.list.setAttribute('aria-hidden',String(!open));ui.listButton.setAttribute('aria-expanded',String(open));ui.listButton.classList.toggle('is-on',open)});
ui.seek.addEventListener('click',event=>{const box=ui.seek.getBoundingClientRect(),ratio=Math.min(1,Math.max(0,(event.clientX-box.left)/box.width));ytPlayer?.seekTo((ytPlayer.getDuration()||0)*ratio,true)});
updateOptionIndicator();selectMode('clock',true);setInterval(updateClock,200);loadYouTubeAPI();if(location.protocol==='file:')ui.notice.hidden=false;
