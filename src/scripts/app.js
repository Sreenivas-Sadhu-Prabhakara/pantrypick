// pantrypick client island — all matching runs in the browser, nothing leaves
// the device. Data (recipes + ingredient index) is imported at build time.
import recipesData from '../data/recipes.json';
import ingredientIndex from '../data/ingredient-index.json';
import { canon } from './synonyms.js';

const LS_PANTRY = 'pantrypick.pantry.v1';
const LS_STAPLES_OFF = 'pantrypick.staplesOff.v1';

// Canonical staple names come from the index (staple:true).
const STAPLE_NAMES = ingredientIndex.filter((i) => i.staple).map((i) => i.name);
const STAPLE_SET = new Set(STAPLE_NAMES);

// Non-staple ingredients available for autocomplete, ranked by how many
// recipes use them (common first).
const AUTOCOMPLETE = ingredientIndex
  .filter((i) => !i.staple)
  .sort((a, b) => b.count - a.count);

// ---------- state ----------
let pantry = load(LS_PANTRY, []); // array of canonical ingredient names
let staplesOff = new Set(load(LS_STAPLES_OFF, [])); // canonical staples the user does NOT have
const filters = {
  vegetarian: false,
  vegan: false,
  'gluten-free': false,
  'dairy-free': false,
  maxTime: 0, // 0 = any
  maxMissing: 99, // hide recipes missing more than N
};

function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}

// The effective "have" set = typed pantry + staples not toggled off.
function haveSet() {
  const s = new Set(pantry);
  for (const st of STAPLE_NAMES) if (!staplesOff.has(st)) s.add(st);
  return s;
}

// ---------- matching ----------
function scoreRecipe(recipe, have) {
  const missing = [];
  let required = 0;
  for (const ing of recipe.ingredients) {
    // Staples are assumed present unless the user toggled them off.
    if (ing.staple && !staplesOff.has(ing.name)) continue;
    required += 1;
    if (!have.has(ing.name)) missing.push(ing);
  }
  return { missing, required, missingCount: missing.length };
}

function passesFilters(recipe) {
  const t = new Set(recipe.tags);
  if (filters.vegetarian && !t.has('vegetarian')) return false;
  if (filters.vegan && !t.has('vegan')) return false;
  if (filters['gluten-free'] && !t.has('gluten-free')) return false;
  if (filters['dairy-free'] && !t.has('dairy-free')) return false;
  if (filters.maxTime > 0 && recipe.time > filters.maxTime) return false;
  return true;
}

function computeResults() {
  const have = haveSet();
  const rows = [];
  for (const r of recipesData) {
    if (!passesFilters(r)) continue;
    const s = scoreRecipe(r, have);
    if (s.missingCount > filters.maxMissing) continue;
    rows.push({ recipe: r, ...s });
  }
  // Rank: fewest missing first; then recipes where you have MORE of the
  // required ingredients (higher coverage); then quicker; then A-Z.
  rows.sort((a, b) => {
    if (a.missingCount !== b.missingCount) return a.missingCount - b.missingCount;
    const covA = a.required ? (a.required - a.missingCount) / a.required : 0;
    const covB = b.required ? (b.required - b.missingCount) / b.required : 0;
    if (covB !== covA) return covB - covA;
    if (a.recipe.time !== b.recipe.time) return a.recipe.time - b.recipe.time;
    return a.recipe.title.localeCompare(b.recipe.title);
  });
  return rows;
}

// ---------- rendering ----------
const el = (id) => document.getElementById(id);
const CARDS = el('cards');
const RESULTS_COUNT = el('results-count');
const CHIPS = el('chips');

function statusClass(missingCount) {
  if (missingCount === 0) return 'all';
  if (missingCount <= 2) return 'few';
  return 'many';
}
function statusLabel(missingCount) {
  if (missingCount === 0) return 'Ready to cook';
  if (missingCount === 1) return 'Missing 1';
  return `Missing ${missingCount}`;
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}
function titleCase(s) {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderResults() {
  const rows = computeResults();
  RESULTS_COUNT.innerHTML = rows.length === 1
    ? `<span class="num">1</span> recipe you can make`
    : `<span class="num">${rows.length}</span> recipes you can make`;

  if (rows.length === 0) {
    CARDS.innerHTML = '';
    CARDS.hidden = true;
    el('empty').hidden = false;
    return;
  }
  el('empty').hidden = true;
  CARDS.hidden = false;

  const frag = document.createDocumentFragment();
  for (const row of rows) {
    const r = row.recipe;
    const cls = statusClass(row.missingCount);
    const have = row.required - row.missingCount;

    const pips = [];
    // cap pips at a readable number
    const shown = Math.min(row.required, 12);
    for (let i = 0; i < shown; i++) {
      pips.push(`<span class="pip ${i < have ? 'pip--have' : ''}"></span>`);
    }

    const missingText = row.missingCount === 0
      ? `<p class="recipe__missing recipe__missing--none">You have everything you need.</p>`
      : `<p class="recipe__missing">Still need: <b>${row.missing.map((m) => esc(titleCase(m.display))).join(', ')}</b></p>`;

    const tags = r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'recipe';
    card.setAttribute('data-id', r.id);
    card.setAttribute('aria-label', `${r.title} — ${statusLabel(row.missingCount)}. Open recipe.`);
    card.innerHTML = `
      <span class="recipe__status recipe__status--${cls}">${statusLabel(row.missingCount)}</span>
      <h3 class="recipe__title">${esc(r.title)}</h3>
      <div class="recipe__meta">
        <span><b class="num">${r.time}</b> min</span>
        <span><b class="num">${r.servings}</b> ${r.servings === 1 ? 'serving' : 'servings'}</span>
        <span>${esc(r.cuisine)}</span>
      </div>
      <div class="pips">${pips.join('')}<span class="pips__label"><span class="num">${have}</span>/<span class="num">${row.required}</span> on hand</span></div>
      ${missingText}
      ${tags ? `<div class="tags">${tags}</div>` : ''}
    `;
    card.addEventListener('click', () => openRecipe(r.id));
    frag.appendChild(card);
  }
  CARDS.innerHTML = '';
  CARDS.appendChild(frag);
}

function renderChips() {
  if (pantry.length === 0) {
    CHIPS.innerHTML = `<span class="chips__empty">No ingredients yet — add what's in your kitchen.</span>`;
    return;
  }
  CHIPS.innerHTML = pantry.map((name) => `
    <span class="chip">${esc(titleCase(name))}
      <button type="button" aria-label="Remove ${esc(titleCase(name))}" data-remove="${esc(name)}">&times;</button>
    </span>`).join('');
  CHIPS.querySelectorAll('button[data-remove]').forEach((b) => {
    b.addEventListener('click', () => removeIngredient(b.getAttribute('data-remove')));
  });
}

// ---------- pantry mutations ----------
function addIngredient(rawName) {
  const name = canon(rawName);
  if (!name) return;
  // Only add ingredients that exist somewhere in the corpus so matching works.
  const known = ingredientIndex.some((i) => i.name === name);
  if (!known) {
    flashInput(`"${titleCase(rawName)}" isn't in the library yet`);
    return;
  }
  if (STAPLE_SET.has(name)) {
    // Staples are handled by the staples panel; re-enable it instead.
    staplesOff.delete(name);
    save(LS_STAPLES_OFF, [...staplesOff]);
    renderStaples();
    renderResults();
    return;
  }
  if (!pantry.includes(name)) {
    pantry.push(name);
    save(LS_PANTRY, pantry);
    renderChips();
    renderResults();
  }
}
function removeIngredient(name) {
  pantry = pantry.filter((n) => n !== name);
  save(LS_PANTRY, pantry);
  renderChips();
  renderResults();
}

let flashTimer;
function flashInput(msg) {
  const note = el('entry-note');
  note.textContent = msg;
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { note.textContent = ''; }, 2600);
}

// ---------- autocomplete ----------
const INPUT = el('ingredient-input');
const AC = el('autocomplete');
let acItems = [];
let acActive = -1;

function updateAutocomplete() {
  const q = canon(INPUT.value);
  if (!q) { hideAC(); return; }
  const inPantry = new Set(pantry);
  acItems = AUTOCOMPLETE
    .filter((i) => i.name.includes(q) && !inPantry.has(i.name))
    .slice(0, 8);
  if (acItems.length === 0) { hideAC(); return; }
  acActive = -1;
  AC.innerHTML = acItems.map((i, idx) => `
    <div class="ac__opt" role="option" id="ac-opt-${idx}" aria-selected="false" data-name="${esc(i.name)}">
      <span>${esc(titleCase(i.name))}</span>
      <small>in <span class="num">${i.count}</span> ${i.count === 1 ? 'recipe' : 'recipes'}</small>
    </div>`).join('');
  AC.hidden = false;
  INPUT.setAttribute('aria-expanded', 'true');
  AC.querySelectorAll('.ac__opt').forEach((opt) => {
    opt.addEventListener('mousedown', (e) => {
      e.preventDefault();
      addIngredient(opt.getAttribute('data-name'));
      INPUT.value = '';
      hideAC();
      INPUT.focus();
    });
  });
}
function hideAC() {
  AC.hidden = true;
  AC.innerHTML = '';
  acItems = [];
  acActive = -1;
  INPUT.setAttribute('aria-expanded', 'false');
  INPUT.removeAttribute('aria-activedescendant');
}
function moveAC(delta) {
  if (acItems.length === 0) return;
  acActive = (acActive + delta + acItems.length) % acItems.length;
  AC.querySelectorAll('.ac__opt').forEach((opt, i) => {
    const on = i === acActive;
    opt.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) {
      opt.scrollIntoView({ block: 'nearest' });
      INPUT.setAttribute('aria-activedescendant', opt.id);
    }
  });
}

// ---------- staples panel ----------
const STAPLES_LIST = el('staples-list');
function renderStaples() {
  STAPLES_LIST.innerHTML = STAPLE_NAMES.map((name) => {
    const on = !staplesOff.has(name);
    return `<label class="staple ${on ? '' : 'is-off'}">
      <input type="checkbox" data-staple="${esc(name)}" ${on ? 'checked' : ''}>
      <span>${esc(titleCase(name))}</span>
    </label>`;
  }).join('');
  STAPLES_LIST.querySelectorAll('input[data-staple]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const name = cb.getAttribute('data-staple');
      if (cb.checked) staplesOff.delete(name);
      else staplesOff.add(name);
      save(LS_STAPLES_OFF, [...staplesOff]);
      renderStaples();
      renderResults();
    });
  });
}

// ---------- recipe dialog ----------
const DIALOG = el('recipe-dialog');
function openRecipe(id) {
  const r = recipesData.find((x) => x.id === id);
  if (!r) return;
  const have = haveSet();

  const ingHtml = r.ingredients.map((ing) => {
    const present = have.has(ing.name);
    const cls = present ? 'have' : 'need';
    const mark = present ? 'Have' : 'Need';
    const stapleNote = ing.staple ? ` <span class="ing-staple-note">(staple)</span>` : '';
    return `<li class="${cls}">
      <span class="ing-mark">${mark}</span>
      <span class="ing-name">${esc(titleCase(ing.display))}${stapleNote}</span>
      <span class="ing-qty">${esc(ing.qty)}</span>
    </li>`;
  }).join('');

  const stepsHtml = r.steps.map((s) => `<li>${esc(s)}</li>`).join('');
  const tags = r.tags.length
    ? `<div class="tags" style="margin-top:.6rem">${r.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>`
    : `<p class="ing-staple-note" style="margin-top:.6rem">No dietary tags — check the ingredients.</p>`;

  el('modal-body').innerHTML = `
    <button type="button" class="modal__close" aria-label="Close recipe" data-close>&times;</button>
    <h2 class="modal__title" id="modal-title">${esc(r.title)}</h2>
    <div class="modal__meta">
      <span><b class="num">${r.time}</b> min total</span>
      <span><b class="num">${r.servings}</b> ${r.servings === 1 ? 'serving' : 'servings'}</span>
      <span>${esc(r.cuisine)}</span>
    </div>
    ${tags}
    <h4>Ingredients — highlighted by what you have</h4>
    <ul class="ing-list">${ingHtml}</ul>
    <h4>Method</h4>
    <ol class="steps">${stepsHtml}</ol>
    <p class="modal__disclaimer">Dietary and allergen tags are best-effort. Always check the
      ingredients yourself if you cook for allergies or strict diets.</p>
  `;
  el('modal-body').querySelector('[data-close]').addEventListener('click', () => DIALOG.close());
  if (typeof DIALOG.showModal === 'function') DIALOG.showModal();
  else DIALOG.setAttribute('open', '');
}

// ---------- wire up ----------
function init() {
  renderChips();
  renderStaples();
  renderResults();

  el('add-btn').addEventListener('click', () => {
    if (acActive >= 0 && acItems[acActive]) addIngredient(acItems[acActive].name);
    else if (INPUT.value.trim()) addIngredient(INPUT.value);
    INPUT.value = '';
    hideAC();
    INPUT.focus();
  });

  INPUT.addEventListener('input', updateAutocomplete);
  INPUT.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveAC(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveAC(-1); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (acActive >= 0 && acItems[acActive]) addIngredient(acItems[acActive].name);
      else if (INPUT.value.trim()) addIngredient(INPUT.value);
      INPUT.value = '';
      hideAC();
    } else if (e.key === 'Escape') { hideAC(); }
  });
  INPUT.addEventListener('blur', () => setTimeout(hideAC, 120));

  el('clear-btn').addEventListener('click', () => {
    pantry = [];
    save(LS_PANTRY, pantry);
    renderChips();
    renderResults();
    INPUT.focus();
  });

  // dietary toggles
  document.querySelectorAll('input[data-filter]').forEach((cb) => {
    cb.addEventListener('change', () => {
      const key = cb.getAttribute('data-filter');
      filters[key] = cb.checked;
      renderResults();
    });
  });

  // max time
  const timeSel = el('filter-time');
  timeSel.addEventListener('change', () => {
    filters.maxTime = parseInt(timeSel.value, 10) || 0;
    renderResults();
  });

  // max missing
  const missRange = el('filter-missing');
  const missVal = el('filter-missing-val');
  const applyMissing = () => {
    const v = parseInt(missRange.value, 10);
    filters.maxMissing = v >= 10 ? 99 : v;
    missVal.textContent = v >= 10 ? 'any' : String(v);
    renderResults();
  };
  missRange.addEventListener('input', applyMissing);
  applyMissing();

  // dialog: close on backdrop click + escape already native
  DIALOG.addEventListener('click', (e) => {
    if (e.target === DIALOG) DIALOG.close();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
