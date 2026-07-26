// ---------- state ----------
const state = {
  algo: 'bubble',
  baseArray: [],
  steps: [],
  stepIndex: 0,
  playing: false,
  timer: null,
};

const els = {
  vizArea: document.getElementById('vizArea'),
  legend: document.getElementById('legend'),
  tabs: document.getElementById('tabs'),
  sizeSlider: document.getElementById('sizeSlider'),
  sizeVal: document.getElementById('sizeVal'),
  speedSlider: document.getElementById('speedSlider'),
  speedVal: document.getElementById('speedVal'),
  targetField: document.getElementById('targetField'),
  targetInput: document.getElementById('targetInput'),
  newArrayBtn: document.getElementById('newArrayBtn'),
  stepBtn: document.getElementById('stepBtn'),
  playBtn: document.getElementById('playBtn'),
  resetBtn: document.getElementById('resetBtn'),
  stepLog: document.getElementById('stepLog'),
  statusBadge: document.getElementById('statusBadge'),
  complexityTable: document.getElementById('complexityTable'),
};

const COMPLEXITY = {
  bubble:   { best:'O(n)', avg:'O(n\u00b2)', worst:'O(n\u00b2)', space:'O(1)' },
  selection:{ best:'O(n\u00b2)', avg:'O(n\u00b2)', worst:'O(n\u00b2)', space:'O(1)' },
  insertion:{ best:'O(n)', avg:'O(n\u00b2)', worst:'O(n\u00b2)', space:'O(1)' },
  binary:   { best:'O(1)', avg:'O(log n)', worst:'O(log n)', space:'O(1)' },
};

const LEGENDS = {
  bubble:   [['comparing','amber'],['swapped','teal'],['sorted','green']],
  selection:[['comparing','amber'],['current min','red'],['sorted','green']],
  insertion:[['key (being placed)','red'],['shifting','amber'],['sorted','green']],
  binary:   [['search range','amber'],['mid (checking)','red'],['found','green']],
};

// ---------- array generation ----------
function generateArray(n){
  const arr = [];
  for(let i=0;i<n;i++) arr.push(Math.floor(Math.random()*90)+5);
  return arr;
}

// ---------- step generators ----------
function bubbleSteps(input){
  const a = [...input];
  const n = a.length;
  const steps = [];
  const sortedSet = new Set();
  steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:'Starting array.'});
  for(let i=0;i<n-1;i++){
    let swappedAny = false;
    for(let j=0;j<n-1-i;j++){
      steps.push({array:[...a], comparing:[j,j+1], sorted:[...sortedSet],
        note:`Comparing index ${j} (${a[j]}) and ${j+1} (${a[j+1]}).`});
      if(a[j] > a[j+1]){
        [a[j],a[j+1]] = [a[j+1],a[j]];
        swappedAny = true;
        steps.push({array:[...a], swapped:[j,j+1], sorted:[...sortedSet],
          note:`${a[j+1]} > ${a[j]} was true — swapped.`});
      }
    }
    sortedSet.add(n-1-i);
    steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:`Pass ${i+1} complete. Index ${n-1-i} is now in final position.`});
    if(!swappedAny) break;
  }
  for(let k=0;k<n;k++) sortedSet.add(k);
  steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:'Array fully sorted.'});
  return steps;
}

function selectionSteps(input){
  const a = [...input];
  const n = a.length;
  const steps = [];
  const sortedSet = new Set();
  steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:'Starting array.'});
  for(let i=0;i<n-1;i++){
    let minIdx = i;
    steps.push({array:[...a], comparing:[], pivot:[minIdx], sorted:[...sortedSet], note:`Assume index ${i} (${a[i]}) is the minimum of the unsorted region.`});
    for(let j=i+1;j<n;j++){
      steps.push({array:[...a], comparing:[j], pivot:[minIdx], sorted:[...sortedSet], note:`Comparing candidate ${a[j]} (index ${j}) against current min ${a[minIdx]} (index ${minIdx}).`});
      if(a[j] < a[minIdx]){
        minIdx = j;
        steps.push({array:[...a], comparing:[], pivot:[minIdx], sorted:[...sortedSet], note:`New minimum found: ${a[minIdx]} at index ${minIdx}.`});
      }
    }
    if(minIdx !== i){
      [a[i],a[minIdx]] = [a[minIdx],a[i]];
      steps.push({array:[...a], swapped:[i,minIdx], sorted:[...sortedSet], note:`Swapped index ${i} with index ${minIdx}.`});
    }
    sortedSet.add(i);
    steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:`Index ${i} (${a[i]}) is now locked into its sorted position.`});
  }
  for(let k=0;k<n;k++) sortedSet.add(k);
  steps.push({array:[...a], comparing:[], sorted:[...sortedSet], note:'Array fully sorted.'});
  return steps;
}

function insertionSteps(input){
  const a = [...input];
  const n = a.length;
  const steps = [];
  steps.push({array:[...a], comparing:[], sorted:[0], note:'Starting array. Index 0 is trivially sorted.'});
  for(let i=1;i<n;i++){
    let key = a[i];
    let j = i-1;
    steps.push({array:[...a], pivot:[i], sorted:range(0,i-1), note:`Key = ${key} (index ${i}). Comparing backward through the sorted region.`});
    while(j >= 0 && a[j] > key){
      a[j+1] = a[j];
      steps.push({array:[...a], comparing:[j], sorted:range(0,i-1), note:`${a[j]} > ${key} — shifted right.`});
      j--;
    }
    a[j+1] = key;
    steps.push({array:[...a], swapped:[j+1], sorted:range(0,i), note:`Key ${key} placed at index ${j+1}.`});
  }
  steps.push({array:[...a], comparing:[], sorted:range(0,n-1), note:'Array fully sorted.'});
  return steps;
}

function range(a,b){ const r=[]; for(let i=a;i<=b;i++) r.push(i); return r; }

function binarySteps(input, target){
  const a = [...input].sort((x,y)=>x-y);
  const n = a.length;
  const steps = [];
  let low=0, high=n-1;
  steps.push({array:[...a], low, high, mid:-1, note:`Array sorted ascending. Searching for ${target}. Range = [0, ${n-1}].`});
  let found = -1;
  while(low <= high){
    const mid = Math.floor((low+high)/2);
    steps.push({array:[...a], low, high, mid, note:`Mid = index ${mid} (value ${a[mid]}).`});
    if(a[mid] === target){
      found = mid;
      steps.push({array:[...a], low, high, mid, foundIdx:mid, note:`Match! ${target} found at index ${mid}.`});
      break;
    } else if(a[mid] < target){
      steps.push({array:[...a], low, high, mid, note:`${a[mid]} < ${target} — search right half.`});
      low = mid+1;
    } else {
      steps.push({array:[...a], low, high, mid, note:`${a[mid]} > ${target} — search left half.`});
      high = mid-1;
    }
    steps.push({array:[...a], low, high, mid:-1, note:`New range = [${low}, ${high}].`});
  }
  if(found === -1){
    steps.push({array:[...a], low, high, mid:-1, note:`${target} is not in the array. Range is empty — search ends.`});
  }
  return steps;
}

// ---------- rendering ----------
function maxVal(){ return Math.max(...state.baseArray, 1); }

function renderLegend(){
  const colorMap = {amber:'var(--amber)', teal:'var(--teal)', green:'var(--green)', red:'var(--red)'};
  els.legend.innerHTML = LEGENDS[state.algo].map(([label,color])=>
    `<div class="legend-item"><span class="swatch" style="background:${colorMap[color]}"></span>${label}</div>`
  ).join('');
}

function renderComplexity(){
  const c = COMPLEXITY[state.algo];
  els.complexityTable.innerHTML = `
    <tr><th>Case</th><th>Time</th></tr>
    <tr><td>Best</td><td class="hl">${c.best}</td></tr>
    <tr><td>Average</td><td>${c.avg}</td></tr>
    <tr><td>Worst</td><td>${c.worst}</td></tr>
    <tr><td>Space</td><td>${c.space}</td></tr>
  `;
}

function renderStep(){
  const step = state.steps[state.stepIndex];
  if(!step){ return; }
  const mv = maxVal();

  if(state.algo === 'binary'){
    renderBinaryStep(step, mv);
  } else {
    renderSortStep(step, mv);
  }

  els.stepLog.innerHTML = `<span class="idx">${state.stepIndex+1}/${state.steps.length}</span>${step.note}`;

  if(state.stepIndex >= state.steps.length - 1){
    stopPlaying();
    els.statusBadge.textContent = 'done';
    els.statusBadge.className = 'status-badge done';
  } else if(state.playing){
    els.statusBadge.textContent = 'running';
    els.statusBadge.className = 'status-badge running';
  } else {
    els.statusBadge.textContent = 'paused';
    els.statusBadge.className = 'status-badge';
  }
}

function renderSortStep(step, mv){
  const arr = step.array;
  els.vizArea.innerHTML = arr.map((val, i)=>{
    let cls = 'bar';
    if(step.sorted && step.sorted.includes(i)) cls += ' sorted';
    if(step.comparing && step.comparing.includes(i)) cls += ' comparing';
    if(step.swapped && step.swapped.includes(i)) cls += ' swapped';
    if(step.pivot && step.pivot.includes(i)) cls += ' pivot';
    const h = Math.max(4, Math.round((val/mv)*100));
    return `<div class="bar-wrap"><div class="${cls}" style="height:${h}%"><div class="bar-value">${val}</div></div></div>`;
  }).join('');
}

function renderBinaryStep(step, mv){
  const arr = step.array;
  els.vizArea.innerHTML = arr.map((val, i)=>{
    let cls = 'bar';
    if(step.foundIdx === i) cls += ' sorted';
    else if(i === step.mid) cls += ' pivot';
    else if(i < step.low || i > step.high) cls += ' '; // out of range, default dim
    else cls += ' comparing';
    const h = Math.max(4, Math.round((val/mv)*100));
    return `<div class="bar-wrap"><div class="${cls}" style="height:${h}%"><div class="bar-value">${val}</div></div></div>`;
  }).join('');
}

// ---------- controls ----------
function buildSteps(){
  const target = parseInt(els.targetInput.value, 10);
  switch(state.algo){
    case 'bubble': state.steps = bubbleSteps(state.baseArray); break;
    case 'selection': state.steps = selectionSteps(state.baseArray); break;
    case 'insertion': state.steps = insertionSteps(state.baseArray); break;
    case 'binary': state.steps = binarySteps(state.baseArray, target); break;
  }
  state.stepIndex = 0;
}

function newArray(){
  stopPlaying();
  const n = parseInt(els.sizeSlider.value, 10);
  state.baseArray = generateArray(n);
  if(state.algo === 'binary'){
    // pick a real target from the array most of the time, so "found" is demonstrable
    const useReal = Math.random() < 0.7;
    const target = useReal ? state.baseArray[Math.floor(Math.random()*n)] : Math.floor(Math.random()*90)+5;
    els.targetInput.value = target;
  }
  buildSteps();
  els.statusBadge.textContent = 'idle';
  els.statusBadge.className = 'status-badge';
  renderStep();
}

function resetPlayback(){
  stopPlaying();
  buildSteps();
  els.statusBadge.textContent = 'idle';
  els.statusBadge.className = 'status-badge';
  renderStep();
}

function stepForward(){
  if(state.stepIndex < state.steps.length - 1){
    state.stepIndex++;
    renderStep();
  }
}

function speedToMs(){
  const v = parseInt(els.speedSlider.value, 10);
  return { 1:900, 2:600, 3:400, 4:220, 5:100 }[v];
}

function startPlaying(){
  if(state.stepIndex >= state.steps.length - 1) return;
  state.playing = true;
  els.playBtn.textContent = 'Pause ❚❚';
  state.timer = setInterval(()=>{
    if(state.stepIndex >= state.steps.length - 1){ stopPlaying(); return; }
    stepForward();
  }, speedToMs());
}

function stopPlaying(){
  state.playing = false;
  els.playBtn.textContent = 'Play ▸';
  if(state.timer){ clearInterval(state.timer); state.timer = null; }
}

function togglePlay(){
  if(state.playing) stopPlaying(); else startPlaying();
}

// ---------- events ----------
els.tabs.addEventListener('click', (e)=>{
  const btn = e.target.closest('.tab');
  if(!btn) return;
  [...els.tabs.children].forEach(t=>t.classList.remove('active'));
  btn.classList.add('active');
  state.algo = btn.dataset.algo;
  els.targetField.style.display = state.algo === 'binary' ? 'block' : 'none';
  renderLegend();
  renderComplexity();
  newArray();
});

els.sizeSlider.addEventListener('input', ()=>{
  els.sizeVal.textContent = els.sizeSlider.value;
});
els.sizeSlider.addEventListener('change', newArray);

els.speedSlider.addEventListener('input', ()=>{
  const labels = {1:'Slowest',2:'Slow',3:'Normal',4:'Fast',5:'Fastest'};
  els.speedVal.textContent = labels[els.speedSlider.value];
  if(state.playing){ stopPlaying(); startPlaying(); }
});

els.targetInput.addEventListener('change', ()=>{
  if(state.algo === 'binary') resetPlayback();
});

els.newArrayBtn.addEventListener('click', newArray);
els.stepBtn.addEventListener('click', ()=>{ stopPlaying(); stepForward(); });
els.playBtn.addEventListener('click', togglePlay);
els.resetBtn.addEventListener('click', resetPlayback);

// ---------- init ----------
renderLegend();
renderComplexity();
newArray();
