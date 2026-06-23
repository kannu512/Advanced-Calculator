// =====================================================
//  CALCULATOR — script.js
//  Fixed: Enter key bug (e.preventDefault)
//  Effect: Liquid blob ripple on every button press
// =====================================================

// ===========================
//  STATE
// ===========================
let currentInput   = '0';
let expression     = '';
let justCalculated = false;
let openParens     = 0;

const displayEl   = document.getElementById('display');
const exprEl      = document.getElementById('expression');
const displayArea = document.getElementById('display-area');

// ===========================
//  LIQUID EFFECT PALETTES
//  Random rang har press pe — green, purple, pink, blue, amber, red, cyan, orange
// ===========================
const LIQUID_PALETTES = [
  { c1: 'rgba(52,211,153,0.88)',  c2: 'rgba(16,185,129,0.38)'  },  // green
  { c1: 'rgba(167,139,250,0.88)', c2: 'rgba(139,92,246,0.38)'  },  // purple
  { c1: 'rgba(244,114,182,0.88)', c2: 'rgba(236,72,153,0.38)'  },  // pink
  { c1: 'rgba(96,165,250,0.88)',  c2: 'rgba(59,130,246,0.38)'  },  // blue
  { c1: 'rgba(251,191,36,0.88)',  c2: 'rgba(245,158,11,0.38)'  },  // amber
  { c1: 'rgba(248,113,113,0.88)', c2: 'rgba(239,68,68,0.38)'   },  // red
  { c1: 'rgba(34,211,238,0.88)',  c2: 'rgba(6,182,212,0.38)'   },  // cyan
  { c1: 'rgba(251,146,60,0.88)',  c2: 'rgba(249,115,22,0.38)'  },  // orange
];

function getRandomPalette() {
  return LIQUID_PALETTES[Math.floor(Math.random() * LIQUID_PALETTES.length)];
}

// ===========================
//  LIQUID RIPPLE EFFECT
//  Har press pe ek <span class="liq"> inject hota hai button ke andar.
//  CSS liqDrop animation: thin ring + glow + organic border-radius morph = liquid feel.
//  Span animation khatam hone ke baad automatically remove ho jaata hai.
// ===========================
function addRipple(btn) {
  if (!btn) return;

  const pal = getRandomPalette();

  // Purani ripples clean karo (rapid press ke liye)
  btn.querySelectorAll('.liq').forEach(el => el.remove());

  const drop = document.createElement('span');
  drop.className = 'liq';
  drop.style.setProperty('--c1', pal.c1);
  drop.style.setProperty('--c2', pal.c2);

  btn.appendChild(drop);
  drop.addEventListener('animationend', () => drop.remove(), { once: true });
}

// ===========================
//  DISPLAY
// ===========================
function updateDisplay(val) {
  displayEl.textContent = val;
  const l = String(val).length;
  displayEl.style.fontSize = l > 13 ? '20px' : l > 10 ? '26px' : l > 7 ? '30px' : '38px';
}

// ===========================
//  CALCULATOR CORE
// ===========================
function appendNum(n, btn) {
  addRipple(btn);
  if (justCalculated) { currentInput = n; expression = ''; justCalculated = false; }
  else currentInput = (currentInput === '0') ? n : currentInput + n;
  updateDisplay(currentInput);
}

function appendOp(op, btn) {
  addRipple(btn);
  justCalculated = false;
  const sym = { '*': '×', '/': '÷', '-': '−', '+': '+', '^': '^' };
  expression   = currentInput + ' ' + (sym[op] || op) + ' ';
  currentInput = '';
  exprEl.textContent = expression;
  updateDisplay('0');
}

function appendDot(btn) {
  addRipple(btn);
  if (justCalculated) { currentInput = '0'; justCalculated = false; }
  if (!currentInput.includes('.')) {
    currentInput = (currentInput || '0') + '.';
    updateDisplay(currentInput);
  }
}

function appendSpecial(val, btn) {
  addRipple(btn);
  if (justCalculated && val !== '(' && val !== ')') { currentInput = ''; justCalculated = false; }
  if (val === '(') {
    if (openParens > 0 && currentInput !== '' && currentInput !== '0') {
      currentInput += ')'; openParens--;
    } else {
      if (currentInput === '0') currentInput = '';
      currentInput += '('; openParens++;
    }
  } else {
    currentInput += val;
  }
  updateDisplay(currentInput || '0');
}

function clearDisplay(btn) {
  addRipple(btn);
  currentInput = '0'; expression = ''; justCalculated = false; openParens = 0;
  updateDisplay('0'); exprEl.textContent = '';
}

function backspace(btn) {
  addRipple(btn);
  if (justCalculated) { clearDisplay(btn); return; }
  const last = currentInput.slice(-1);
  if (last === '(') openParens--;
  if (last === ')') openParens++;
  currentInput = currentInput.slice(0, -1) || '0';
  updateDisplay(currentInput);
}

function toggleSign(btn) {
  addRipple(btn);
  if (currentInput && currentInput !== '0')
    currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
  updateDisplay(currentInput);
}

function percentage(btn) {
  addRipple(btn);
  const v = parseFloat(currentInput);
  if (!isNaN(v)) { currentInput = String(v / 100); updateDisplay(currentInput); }
}

function calculate(btn) {
  addRipple(btn);
  try {
    const full = expression + currentInput;
    exprEl.textContent = full + ' =';
    let expr = full
      .replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\^/g, '**');
    let result = Function('"use strict"; return (' + expr + ')')();
    if (!isFinite(result) || isNaN(result)) updateDisplay('Error');
    else {
      result = parseFloat(result.toPrecision(12));
      currentInput = String(result);
      updateDisplay(currentInput);
      addToHistory(full, currentInput); // ← history save
    }
    expression = ''; justCalculated = true; openParens = 0;
    displayArea.classList.add('pulse');
    setTimeout(() => displayArea.classList.remove('pulse'), 300);
  } catch (e) { updateDisplay('Error'); expression = ''; justCalculated = true; }
}

// ===========================
//  SCIENTIFIC
// ===========================
function sciFunc(fn, btn) {
  addRipple(btn);
  const v = parseFloat(currentInput);
  if (isNaN(v)) return;
  const map = {
    sin:  () => Math.sin(v * Math.PI / 180),
    cos:  () => Math.cos(v * Math.PI / 180),
    tan:  () => Math.tan(v * Math.PI / 180),
    log:  () => Math.log10(v),
    ln:   () => Math.log(v),
    sqrt: () => Math.sqrt(v),
    sq:   () => v * v,
    cube: () => v * v * v,
    inv:  () => 1 / v
  };
  const label = fn + '(' + v + ')';
  exprEl.textContent = label + ' =';
  currentInput = String(parseFloat(map[fn]().toPrecision(10)));
  justCalculated = true;
  updateDisplay(currentInput);
  addToHistory(label, currentInput); // ← history save
  displayArea.classList.add('pulse');
  setTimeout(() => displayArea.classList.remove('pulse'), 300);
}

// ===========================
//  THEME TOGGLE + PERSISTENCE
// ===========================
function toggleTheme() {
  const body = document.body;
  const btn  = document.getElementById('theme-toggle');
  if (body.classList.contains('light')) {
    body.classList.remove('light');
    btn.textContent = '☀️ Light';
    localStorage.setItem('calc_theme', 'dark');
  } else {
    body.classList.add('light');
    btn.textContent = '🌙 Dark';
    localStorage.setItem('calc_theme', 'light');
  }
}

function applyTheme() {
  const saved = localStorage.getItem('calc_theme') || 'dark';
  const btn   = document.getElementById('theme-toggle');
  if (saved === 'light') {
    document.body.classList.add('light');
    btn.textContent = '🌙 Dark';
  } else {
    document.body.classList.remove('light');
    btn.textContent = '☀️ Light';
  }
}

// ===========================
//  BUTTON LAYOUT PRESETS
// ===========================
const PRESETS = {
  classic: {
    label: 'Classic',
    rows: [
      [
        { label:'C',  cls:'btn-clear', action:'clearDisplay(this)' },
        { label:'⌫', cls:'btn-func',  action:'backspace(this)' },
        { label:'%',  cls:'btn-func',  action:'percentage(this)', id:'kPCT' },
        { label:'÷',  cls:'btn-op',    action:"appendOp('/',this)", id:'kDIV' },
      ],
      [
        { label:'7', cls:'btn-num', action:"appendNum('7',this)", id:'k7' },
        { label:'8', cls:'btn-num', action:"appendNum('8',this)", id:'k8' },
        { label:'9', cls:'btn-num', action:"appendNum('9',this)", id:'k9' },
        { label:'×', cls:'btn-op',  action:"appendOp('*',this)", id:'kMUL' },
      ],
      [
        { label:'4', cls:'btn-num', action:"appendNum('4',this)", id:'k4' },
        { label:'5', cls:'btn-num', action:"appendNum('5',this)", id:'k5' },
        { label:'6', cls:'btn-num', action:"appendNum('6',this)", id:'k6' },
        { label:'−', cls:'btn-op',  action:"appendOp('-',this)", id:'kSUB' },
      ],
      [
        { label:'1', cls:'btn-num', action:"appendNum('1',this)", id:'k1' },
        { label:'2', cls:'btn-num', action:"appendNum('2',this)", id:'k2' },
        { label:'3', cls:'btn-num', action:"appendNum('3',this)", id:'k3' },
        { label:'+', cls:'btn-op',  action:"appendOp('+',this)", id:'kADD' },
      ],
      [
        { label:'()', cls:'btn-func', action:"appendSpecial('(',this)", id:'kLPAR' },
        { label:'0',  cls:'btn-num',  action:"appendNum('0',this)", id:'k0' },
        { label:'.',  cls:'btn-func', action:'appendDot(this)', id:'kDOT' },
        { label:'=',  cls:'btn-eq',   action:'calculate(this)', id:'kEQ' },
      ],
    ]
  },

  opsleft: {
    label: 'Ops Left',
    rows: [
      [
        { label:'÷',  cls:'btn-op',    action:"appendOp('/',this)" },
        { label:'7',  cls:'btn-num',   action:"appendNum('7',this)" },
        { label:'8',  cls:'btn-num',   action:"appendNum('8',this)" },
        { label:'9',  cls:'btn-num',   action:"appendNum('9',this)" },
      ],
      [
        { label:'×',  cls:'btn-op',    action:"appendOp('*',this)" },
        { label:'4',  cls:'btn-num',   action:"appendNum('4',this)" },
        { label:'5',  cls:'btn-num',   action:"appendNum('5',this)" },
        { label:'6',  cls:'btn-num',   action:"appendNum('6',this)" },
      ],
      [
        { label:'−',  cls:'btn-op',    action:"appendOp('-',this)" },
        { label:'1',  cls:'btn-num',   action:"appendNum('1',this)" },
        { label:'2',  cls:'btn-num',   action:"appendNum('2',this)" },
        { label:'3',  cls:'btn-num',   action:"appendNum('3',this)" },
      ],
      [
        { label:'+',  cls:'btn-op',    action:"appendOp('+',this)" },
        { label:'0',  cls:'btn-num',   action:"appendNum('0',this)" },
        { label:'.',  cls:'btn-func',  action:'appendDot(this)' },
        { label:'=',  cls:'btn-eq',    action:'calculate(this)' },
      ],
      [
        { label:'C',  cls:'btn-clear', action:'clearDisplay(this)' },
        { label:'⌫', cls:'btn-func',  action:'backspace(this)' },
        { label:'%',  cls:'btn-func',  action:'percentage(this)' },
        { label:'()', cls:'btn-func',  action:"appendSpecial('(',this)" },
      ],
    ]
  },

  compact: {
    label: 'Compact',
    rows: [
      [
        { label:'7', cls:'btn-num',   action:"appendNum('7',this)" },
        { label:'8', cls:'btn-num',   action:"appendNum('8',this)" },
        { label:'9', cls:'btn-num',   action:"appendNum('9',this)" },
        { label:'C', cls:'btn-clear', action:'clearDisplay(this)' },
      ],
      [
        { label:'4', cls:'btn-num',  action:"appendNum('4',this)" },
        { label:'5', cls:'btn-num',  action:"appendNum('5',this)" },
        { label:'6', cls:'btn-num',  action:"appendNum('6',this)" },
        { label:'⌫', cls:'btn-func', action:'backspace(this)' },
      ],
      [
        { label:'1', cls:'btn-num',  action:"appendNum('1',this)" },
        { label:'2', cls:'btn-num',  action:"appendNum('2',this)" },
        { label:'3', cls:'btn-num',  action:"appendNum('3',this)" },
        { label:'%', cls:'btn-func', action:'percentage(this)' },
      ],
      [
        { label:'.',  cls:'btn-func', action:'appendDot(this)' },
        { label:'0',  cls:'btn-num',  action:"appendNum('0',this)" },
        { label:'()', cls:'btn-func', action:"appendSpecial('(',this)" },
        { label:'=',  cls:'btn-eq',   action:'calculate(this)' },
      ],
      [
        { label:'÷', cls:'btn-op', action:"appendOp('/',this)" },
        { label:'×', cls:'btn-op', action:"appendOp('*',this)" },
        { label:'−', cls:'btn-op', action:"appendOp('-',this)" },
        { label:'+', cls:'btn-op', action:"appendOp('+',this)" },
      ],
    ]
  },

  centered: {
    label: 'Centered',
    rows: [
      [
        { label:'C',  cls:'btn-clear', action:'clearDisplay(this)' },
        { label:'⌫', cls:'btn-func',  action:'backspace(this)' },
        { label:'%',  cls:'btn-func',  action:'percentage(this)' },
        { label:'()', cls:'btn-func',  action:"appendSpecial('(',this)" },
      ],
      [
        { label:'7', cls:'btn-num', action:"appendNum('7',this)" },
        { label:'8', cls:'btn-num', action:"appendNum('8',this)" },
        { label:'9', cls:'btn-num', action:"appendNum('9',this)" },
        { label:'÷', cls:'btn-op',  action:"appendOp('/',this)" },
      ],
      [
        { label:'4', cls:'btn-num', action:"appendNum('4',this)" },
        { label:'5', cls:'btn-num', action:"appendNum('5',this)" },
        { label:'6', cls:'btn-num', action:"appendNum('6',this)" },
        { label:'×', cls:'btn-op',  action:"appendOp('*',this)" },
      ],
      [
        { label:'1', cls:'btn-num', action:"appendNum('1',this)" },
        { label:'2', cls:'btn-num', action:"appendNum('2',this)" },
        { label:'3', cls:'btn-num', action:"appendNum('3',this)" },
        { label:'−', cls:'btn-op',  action:"appendOp('-',this)" },
      ],
      [
        { label:'+', cls:'btn-op',   action:"appendOp('+',this)" },
        { label:'0', cls:'btn-num',  action:"appendNum('0',this)" },
        { label:'.', cls:'btn-func', action:'appendDot(this)' },
        { label:'=', cls:'btn-eq',   action:'calculate(this)' },
      ],
    ]
  },
};

let currentPreset = 'classic';

function buildStandardGrid(presetKey) {
  const preset = PRESETS[presetKey];
  const grid   = document.getElementById('standard-grid');
  grid.innerHTML = '';
  preset.rows.forEach(row => {
    row.forEach(btn => {
      const b = document.createElement('button');
      b.className = 'btn ' + btn.cls;
      b.textContent = btn.label;
      b.setAttribute('onclick', btn.action);
      if (btn.id) b.id = btn.id;
      grid.appendChild(b);
    });
  });
}

function switchPreset(key) {
  currentPreset = key;
  buildStandardGrid(key);
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === key);
  });
  localStorage.setItem('calc_preset', key);
}

// ===========================
//  MODE SWITCH
// ===========================
function switchMode(mode) {
  ['standard', 'scientific', 'converter'].forEach(m => {
    document.getElementById('mode-' + m).classList.add('hidden');
    document.getElementById('tab-' + m).classList.remove('active');
  });
  document.getElementById('mode-' + mode).classList.remove('hidden');
  document.getElementById('tab-' + mode).classList.add('active');
  clearDisplay();
}

function switchConv(type) {
  document.querySelectorAll('.conv-section').forEach(s => s.classList.add('hidden'));
  document.querySelectorAll('.conv-tab').forEach(t => t.classList.remove('active'));
  document.getElementById('conv-' + type).classList.remove('hidden');
  document.getElementById('ctab-' + type).classList.add('active');
}

// ===========================
//  CONVERTERS
// ===========================
function getRadio(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : null;
}

const rateINR  = {INR:1,USD:0.012,EUR:0.011,GBP:0.0095,JPY:1.78,AED:0.044,CAD:0.016,AUD:0.018,CNY:0.086,SGD:0.016};
const currNames= {INR:'₹ INR',USD:'$ USD',EUR:'€ EUR',GBP:'£ GBP',JPY:'¥ JPY',AED:'AED',CAD:'CA$',AUD:'A$',CNY:'¥ CNY',SGD:'SGD'};
function convertCurrency() {
  const a = parseFloat(document.getElementById('curr-input').value);
  const f = getRadio('curr-from');
  if (isNaN(a) || !f) return;
  const inINR = a / rateINR[f];
  let html = '';
  for (const [k,v] of Object.entries(rateINR)) {
    if (k === f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${currNames[k]}</b><span>${parseFloat((inINR*v).toFixed(4))}</span></span>`;
  }
  document.getElementById('curr-result').innerHTML = html || 'Enter an amount';
}

const lenM     = {m:1,km:1000,cm:0.01,mm:0.001,mile:1609.344,ft:0.3048,inch:0.0254,yard:0.9144,nm:1e-9};
const lenNames = {m:'m',km:'km',cm:'cm',mm:'mm',mile:'mi',ft:'ft',inch:'in',yard:'yd',nm:'nm'};
function convertLength() {
  const v = parseFloat(document.getElementById('len-input').value);
  const f = getRadio('len-from');
  if (isNaN(v)||!f) return;
  const m = v * lenM[f];
  let html = '';
  for (const [k,r] of Object.entries(lenM)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${lenNames[k]}</b><span>${parseFloat((m/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('len-result').innerHTML = html;
}

const areaSqm  = {sqm:1,sqkm:1e6,sqft:0.092903,sqcm:0.0001,acre:4046.86,hectare:10000,sqyard:0.836127,sqmile:2.59e6};
const areaNames= {sqm:'m²',sqkm:'km²',sqft:'ft²',sqcm:'cm²',acre:'Acre',hectare:'Hectare',sqyard:'Yard²',sqmile:'Mile²'};
function convertArea() {
  const v = parseFloat(document.getElementById('area-input').value);
  const f = getRadio('area-from');
  if (isNaN(v)||!f) return;
  const b = v * areaSqm[f];
  let html = '';
  for (const [k,r] of Object.entries(areaSqm)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${areaNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('area-result').innerHTML = html;
}

const massKg   = {kg:1,g:0.001,mg:1e-6,lb:0.453592,oz:0.0283495,ton:1000,quintal:100};
const massNames= {kg:'kg',g:'g',mg:'mg',lb:'lb',oz:'oz',ton:'tonne',quintal:'quintal'};
function convertMass() {
  const v = parseFloat(document.getElementById('mass-input').value);
  const f = getRadio('mass-from');
  if (isNaN(v)||!f) return;
  const b = v * massKg[f];
  let html = '';
  for (const [k,r] of Object.entries(massKg)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${massNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('mass-result').innerHTML = html;
}

function convertTemp() {
  const v  = parseFloat(document.getElementById('temp-input').value);
  const fr = getRadio('temp-from');
  if (isNaN(v)||!fr) return;
  let c;
  if (fr==='C') c=v; else if (fr==='F') c=(v-32)*5/9; else c=v-273.15;
  const results = { C:parseFloat(c.toFixed(4)), F:parseFloat((c*9/5+32).toFixed(4)), K:parseFloat((c+273.15).toFixed(4)) };
  const names   = { C:'°C Celsius', F:'°F Fahrenheit', K:'K Kelvin' };
  let html = '';
  for (const [k,r] of Object.entries(results)) {
    if (k===fr) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${names[k]}</b><span>${r}</span></span>`;
  }
  document.getElementById('temp-result').innerHTML = html;
}

const volL     = {L:1,mL:0.001,m3:1000,cm3:0.001,gal:3.78541,qt:0.946353,pt:0.473176,floz:0.0295735,cup:0.236588,tbsp:0.0147868};
const volNames = {L:'L',mL:'mL',m3:'m³',cm3:'cm³',gal:'Gallon',qt:'Quart',pt:'Pint',floz:'fl oz',cup:'Cup',tbsp:'tbsp'};
function convertVolume() {
  const v = parseFloat(document.getElementById('vol-input').value);
  const f = getRadio('vol-from');
  if (isNaN(v)||!f) return;
  const b = v * volL[f];
  let html = '';
  for (const [k,r] of Object.entries(volL)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${volNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('vol-result').innerHTML = html;
}

const dataB    = {B:1,KB:1024,MB:1048576,GB:1073741824,TB:1.0995e12,PB:1.1259e15,bit:0.125,Kbit:128,Mbit:131072,Gbit:134217728};
const dataNames= {B:'Byte',KB:'KB',MB:'MB',GB:'GB',TB:'TB',PB:'PB',bit:'Bit',Kbit:'Kbit',Mbit:'Mbit',Gbit:'Gbit'};
function convertData() {
  const v = parseFloat(document.getElementById('data-input').value);
  const f = getRadio('data-from');
  if (isNaN(v)||!f) return;
  const b = v * dataB[f];
  let html = '';
  for (const [k,r] of Object.entries(dataB)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${dataNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('data-result').innerHTML = html;
}

const spdMs    = {ms:1,kmh:1/3.6,mph:0.44704,knot:0.514444,mach:343,fts:0.3048};
const spdNames = {ms:'m/s',kmh:'km/h',mph:'mph',knot:'knot',mach:'mach',fts:'ft/s'};
function convertSpeed() {
  const v = parseFloat(document.getElementById('spd-input').value);
  const f = getRadio('spd-from');
  if (isNaN(v)||!f) return;
  const b = v * spdMs[f];
  let html = '';
  for (const [k,r] of Object.entries(spdMs)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${spdNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('spd-result').innerHTML = html;
}

const timeS    = {s:1,ms:0.001,min:60,hr:3600,day:86400,week:604800,month:2629800,year:31557600};
const timeNames= {s:'second',ms:'millisec',min:'minute',hr:'hour',day:'day',week:'week',month:'month',year:'year'};
function convertTime() {
  const v = parseFloat(document.getElementById('time-input').value);
  const f = getRadio('time-from');
  if (isNaN(v)||!f) return;
  const b = v * timeS[f];
  let html = '';
  for (const [k,r] of Object.entries(timeS)) {
    if (k===f) continue;
    html += `<span style="display:flex;justify-content:space-between"><b>${timeNames[k]}</b><span>${parseFloat((b/r).toPrecision(6))}</span></span>`;
  }
  document.getElementById('time-result').innerHTML = html;
}

function calcTip() {
  const bill   = parseFloat(document.getElementById('tip-bill').value)   || 0;
  const pct    = parseFloat(document.getElementById('tip-pct').value)    || 0;
  const people = parseInt(document.getElementById('tip-people').value)   || 1;
  const tip = bill * pct / 100;
  const total = bill + tip;
  document.getElementById('tip-result').innerHTML =
    `<span style="display:flex;justify-content:space-between"><b>Tip Amount</b><span>₹${tip.toFixed(2)}</span></span>
     <span style="display:flex;justify-content:space-between"><b>Total Bill</b><span>₹${total.toFixed(2)}</span></span>
     <span style="display:flex;justify-content:space-between"><b>Per Person</b><span>₹${(total/people).toFixed(2)}</span></span>`;
}

function calcGST() {
  const amt  = parseFloat(document.getElementById('gst-amount').value) || 0;
  const rate = parseFloat(getRadio('gst-rate') || '18');
  const type = getRadio('gst-type') || 'excl';
  let gst, base, total;
  if (type==='excl') { base=amt; gst=amt*rate/100; total=amt+gst; }
  else               { total=amt; base=amt*100/(100+rate); gst=total-base; }
  document.getElementById('gst-result').innerHTML =
    `<span style="display:flex;justify-content:space-between"><b>Base Amount</b><span>₹${base.toFixed(2)}</span></span>
     <span style="display:flex;justify-content:space-between"><b>GST (${rate}%)</b><span>₹${gst.toFixed(2)}</span></span>
     <span style="display:flex;justify-content:space-between"><b>Total</b><span>₹${total.toFixed(2)}</span></span>`;
}

// ===========================
//  KEYBOARD SUPPORT
//  BUG FIX: e.preventDefault() for Enter/= 
//  Pehle bug yeh tha: Enter press karne par jo button focus mein hota tha
//  (jaise + button) uska click bhi fire hota tha — is wajah se calculate()
//  ke baad appendOp() chal jaata tha aur display 0 dikha deta tha.
//  Fix: e.preventDefault() browser ko rokleta hai focused button ka click fire karne se.
// ===========================
document.addEventListener('keydown', function(e) {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  const activeMode = ['standard','scientific'].find(m =>
    !document.getElementById('mode-' + m).classList.contains('hidden')
  );
  if (!activeMode) return;

  const key = e.key;
  if (key >= '0' && key <= '9') { flashBtn('k'+key); appendNum(key); }
  else if (key === '(')          { flashBtn('kLPAR'); appendSpecial('('); }
  else if (key === ')')          { flashBtn('kLPAR'); appendSpecial(')'); }
  else if (key === '+')          { flashBtn('kADD');  appendOp('+'); }
  else if (key === '-')          { flashBtn('kSUB');  appendOp('-'); }
  else if (key === '*')          { flashBtn('kMUL');  appendOp('*'); }
  else if (key === '/') { e.preventDefault(); flashBtn('kDIV'); appendOp('/'); }
  else if (key === '.') { flashBtn('kDOT'); appendDot(); }
  else if (key === 'Enter' || key === '=') {
    e.preventDefault();  // ← BUG FIX: focused button ka click rokta hai
    flashBtn('kEQ');
    calculate();
  }
  else if (key === 'Backspace') { flashBtn('kBACK'); backspace(); }
  else if (key === 'Escape')    { flashBtn('kAC');   clearDisplay(); }
  else if (key === '%')         { flashBtn('kPCT');  percentage(); }
});

function flashBtn(id) {
  const el = document.getElementById(id);
  if (!el) return;
  addRipple(el);
  el.style.transform = 'scale(0.84)';
  el.style.filter    = 'brightness(1.2)';
  setTimeout(() => { el.style.transform = ''; el.style.filter = ''; }, 130);
}

// ===========================
//  HISTORY (localStorage mein save hoti hai)
// ===========================
const MAX_HISTORY = 50;

function addToHistory(expr, result) {
  try {
    const items = JSON.parse(localStorage.getItem('calc_history') || '[]');
    items.unshift({ expr: expr.trim(), result });
    if (items.length > MAX_HISTORY) items.length = MAX_HISTORY;
    localStorage.setItem('calc_history', JSON.stringify(items));
    // Panel open hai toh live update karo
    if (!document.getElementById('hist-panel').classList.contains('hidden')) {
      renderHistory();
    }
  } catch (e) {}
}

function clearHistory() {
  localStorage.removeItem('calc_history');
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById('hist-list');
  let items = [];
  try { items = JSON.parse(localStorage.getItem('calc_history') || '[]'); } catch {}
  if (!items.length) {
    list.innerHTML = '<div class="hist-empty">No calculations yet</div>';
    return;
  }
  list.innerHTML = items.map((it, i) =>
    `<div class="hist-item" onclick="useHistoryItem(${i})">
       <div class="hist-expr">${it.expr} =</div>
       <div class="hist-result">${it.result}</div>
     </div>`
  ).join('');
}

function useHistoryItem(index) {
  try {
    const items = JSON.parse(localStorage.getItem('calc_history') || '[]');
    if (items[index]) {
      currentInput = String(items[index].result);
      expression = '';
      justCalculated = true;
      updateDisplay(currentInput);
      toggleHistory(); // panel band karo
    }
  } catch {}
}

function toggleHistory() {
  const panel  = document.getElementById('hist-panel');
  const togBtn = document.getElementById('hist-toggle-btn');
  const isHidden = panel.classList.contains('hidden');
  panel.classList.toggle('hidden');
  togBtn.classList.toggle('active', isHidden);
  if (isHidden) renderHistory(); // open hone par fresh render
}

// ===========================
//  INIT — page load
// ===========================
document.addEventListener('DOMContentLoaded', () => {
  // Theme restore karo
  applyTheme();

  // Preset restore karo
  const savedPreset = localStorage.getItem('calc_preset') || 'classic';
  currentPreset = savedPreset;
  buildStandardGrid(savedPreset);
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.preset === savedPreset);
  });
});