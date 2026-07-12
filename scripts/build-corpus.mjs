// Build the recipe corpus into structured JSON consumed by the app.
// - Combines all recipe batches
// - Assigns stable slug ids
// - Canonicalizes ingredient names (synonym map)
// - Flags staples
// - VALIDATES author-declared dietary tags against ingredients and fails on
//   contradictions (e.g. a "vegan" recipe that contains cheese), so the tags
//   the UI shows are trustworthy.
// - Emits src/data/recipes.json and src/data/ingredient-index.json

import { writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import {
  canonical, STAPLES, MEAT_FISH, ANIMAL_NONVEGAN, GLUTEN, DAIRY,
  matchesAny, slugify,
} from './lib.mjs';

const here = dirname(fileURLToPath(import.meta.url));

const batchFiles = readdirSync(here)
  .filter((f) => /^recipes-\d+.*\.mjs$/.test(f))
  .sort();

let raw = [];
for (const f of batchFiles) {
  const mod = await import(join(here, f));
  raw = raw.concat(mod.default);
}

const errors = [];
const usedSlugs = new Set();
const ingredientSet = new Map(); // canonical -> { count, staple }

function tagContradiction(recipe, canonNames) {
  const problems = [];
  const has = (list, category) => canonNames.some((n) => matchesAny(n, list, category));
  const t = new Set(recipe.tags);

  if (t.has('vegetarian') && has(MEAT_FISH, 'vegetarian')) {
    problems.push('tagged vegetarian but contains meat/fish');
  }
  if (t.has('vegan')) {
    if (has(MEAT_FISH, 'vegan')) problems.push('tagged vegan but contains meat/fish');
    if (has(ANIMAL_NONVEGAN, 'vegan')) problems.push('tagged vegan but contains an animal product');
    if (!t.has('vegetarian')) problems.push('vegan but not also vegetarian');
    if (!t.has('dairy-free')) problems.push('vegan but not tagged dairy-free');
  }
  if (t.has('gluten-free') && has(GLUTEN, 'gluten-free')) {
    problems.push('tagged gluten-free but contains gluten');
  }
  if (t.has('dairy-free') && has(DAIRY, 'dairy-free')) {
    problems.push('tagged dairy-free but contains dairy');
  }
  return problems;
}

const recipes = raw.map((r, i) => {
  // Validate shape.
  for (const key of ['title', 'cuisine', 'servings', 'time', 'ingredients', 'steps', 'tags']) {
    if (r[key] === undefined) errors.push(`Recipe ${i} (${r.title || '?'}) missing "${key}"`);
  }

  let slug = slugify(r.title);
  if (usedSlugs.has(slug)) slug = `${slug}-${i}`;
  usedSlugs.add(slug);

  const ingredients = r.ingredients.map(([name, qty]) => {
    const canon = canonical(name);
    const staple = STAPLES.has(canon);
    const entry = ingredientSet.get(canon) || { count: 0, staple };
    entry.count += 1;
    entry.staple = staple;
    ingredientSet.set(canon, entry);
    return { name: canon, display: name.trim(), qty, staple };
  });

  const canonNames = ingredients.map((x) => x.name);
  const problems = tagContradiction(r, canonNames);
  if (problems.length) {
    errors.push(`Recipe "${r.title}": ${problems.join('; ')}`);
  }

  // Validate tag vocabulary.
  const allowed = new Set(['vegetarian', 'vegan', 'gluten-free', 'dairy-free']);
  for (const tag of r.tags) {
    if (!allowed.has(tag)) errors.push(`Recipe "${r.title}": unknown tag "${tag}"`);
  }
  if (r.time <= 0 || r.time > 600) errors.push(`Recipe "${r.title}": implausible time ${r.time}`);
  if (r.servings <= 0 || r.servings > 30) errors.push(`Recipe "${r.title}": implausible servings ${r.servings}`);
  if (!r.steps.length) errors.push(`Recipe "${r.title}": no steps`);
  if (!r.ingredients.length) errors.push(`Recipe "${r.title}": no ingredients`);

  return {
    id: slug,
    title: r.title,
    cuisine: r.cuisine,
    servings: r.servings,
    time: r.time,
    ingredients,
    steps: r.steps,
    tags: r.tags.slice().sort(),
  };
});

if (errors.length) {
  console.error('\nCORPUS VALIDATION FAILED:\n');
  for (const e of errors) console.error('  - ' + e);
  console.error(`\n${errors.length} problem(s). Fix the recipe data and rebuild.\n`);
  process.exit(1);
}

// Ingredient index (non-staple first for autocomplete relevance).
const index = [...ingredientSet.entries()]
  .map(([name, info]) => ({ name, count: info.count, staple: info.staple }))
  .sort((a, b) => a.name.localeCompare(b.name));

const dataDir = join(here, '..', 'src', 'data');
writeFileSync(join(dataDir, 'recipes.json'), JSON.stringify(recipes, null, 2) + '\n');
writeFileSync(join(dataDir, 'ingredient-index.json'), JSON.stringify(index, null, 2) + '\n');

// Summary
const byTag = { vegetarian: 0, vegan: 0, 'gluten-free': 0, 'dairy-free': 0 };
const byCuisine = {};
for (const r of recipes) {
  for (const t of r.tags) byTag[t] += 1;
  byCuisine[r.cuisine] = (byCuisine[r.cuisine] || 0) + 1;
}
console.log(`Built ${recipes.length} recipes, ${index.length} unique ingredients.`);
console.log('Dietary:', JSON.stringify(byTag));
console.log('Cuisines:', Object.keys(byCuisine).length, '-', Object.keys(byCuisine).sort().join(', '));
console.log(`Staples in index: ${index.filter((x) => x.staple).length}`);
