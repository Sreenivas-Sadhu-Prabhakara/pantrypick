// Shared normalization data + helpers for the corpus build.
// Kept dependency-free so it runs under plain `node`.

// Canonical synonym map: variant -> canonical name.
// Applied to every ingredient name so the pantry matcher is robust across
// regional English (UK/US/IN/AU) and common alternates.
export const SYNONYMS = {
  'scallion': 'green onion',
  'scallions': 'green onion',
  'spring onion': 'green onion',
  'spring onions': 'green onion',
  'green onions': 'green onion',
  'coriander leaves': 'cilantro',
  'fresh coriander': 'cilantro',
  'coriander (fresh)': 'cilantro',
  'aubergine': 'eggplant',
  'aubergines': 'eggplant',
  'brinjal': 'eggplant',
  'capsicum': 'bell pepper',
  'capsicums': 'bell pepper',
  'red capsicum': 'red bell pepper',
  'green capsicum': 'green bell pepper',
  'courgette': 'zucchini',
  'courgettes': 'zucchini',
  'garbanzo beans': 'chickpeas',
  'garbanzos': 'chickpeas',
  'chana': 'chickpeas',
  'chick peas': 'chickpeas',
  'passata': 'tomato passata',
  'plum tomatoes': 'canned tomatoes',
  'tinned tomatoes': 'canned tomatoes',
  'chopped tomatoes': 'canned tomatoes',
  'crushed tomatoes': 'canned tomatoes',
  'coriander powder': 'ground coriander',
  'cumin powder': 'ground cumin',
  'jeera': 'cumin seeds',
  'haldi': 'turmeric',
  'ground turmeric': 'turmeric',
  'turmeric powder': 'turmeric',
  'chilli powder': 'chili powder',
  'red chilli powder': 'chili powder',
  'chilli flakes': 'chili flakes',
  'red pepper flakes': 'chili flakes',
  'crushed red pepper': 'chili flakes',
  'green chilli': 'green chili',
  'green chillies': 'green chili',
  'green chilies': 'green chili',
  'red chilli': 'red chili',
  'red chillies': 'red chili',
  'spring greens': 'collard greens',
  'rocket': 'arugula',
  'prawns': 'shrimp',
  'prawn': 'shrimp',
  'minced beef': 'ground beef',
  'beef mince': 'ground beef',
  'minced pork': 'ground pork',
  'pork mince': 'ground pork',
  'minced lamb': 'ground lamb',
  'lamb mince': 'ground lamb',
  'chicken mince': 'ground chicken',
  'minced chicken': 'ground chicken',
  'mince': 'ground beef',
  'plain flour': 'all-purpose flour',
  'plain white flour': 'all-purpose flour',
  'maida': 'all-purpose flour',
  'self-raising flour': 'self-rising flour',
  'bicarbonate of soda': 'baking soda',
  'bicarb': 'baking soda',
  'caster sugar': 'sugar',
  'granulated sugar': 'sugar',
  'white sugar': 'sugar',
  'icing sugar': 'powdered sugar',
  'confectioners sugar': 'powdered sugar',
  'double cream': 'heavy cream',
  'heavy whipping cream': 'heavy cream',
  'whipping cream': 'heavy cream',
  'single cream': 'light cream',
  'natural yogurt': 'plain yogurt',
  'natural yoghurt': 'plain yogurt',
  'yoghurt': 'yogurt',
  'curd': 'plain yogurt',
  'soured cream': 'sour cream',
  'coriander seeds': 'coriander seeds',
  'garam masala powder': 'garam masala',
  'stock cube': 'bouillon',
  'stock cubes': 'bouillon',
  'vegetable stock': 'vegetable broth',
  'chicken stock': 'chicken broth',
  'beef stock': 'beef broth',
  'gram flour': 'chickpea flour',
  'besan': 'chickpea flour',
  'corn flour': 'cornstarch',
  'cornflour': 'cornstarch',
  'mangetout': 'snow peas',
  'sultanas': 'raisins',
  'spring onion greens': 'green onion',
  'beetroot': 'beet',
  'beetroots': 'beet',
  'swede': 'rutabaga',
  'peppers': 'bell pepper',
  'red pepper': 'red bell pepper',
  'green pepper': 'green bell pepper',
  'yellow pepper': 'yellow bell pepper',
  'kidney beans': 'red kidney beans',
  'rajma': 'red kidney beans',
  'toor dal': 'split pigeon peas',
  'arhar dal': 'split pigeon peas',
  'moong dal': 'split mung beans',
  'masoor dal': 'red lentils',
  'red lentil': 'red lentils',
  'puy lentils': 'green lentils',
  'flat leaf parsley': 'parsley',
  'flat-leaf parsley': 'parsley',
  'italian parsley': 'parsley',
  'chinese cabbage': 'napa cabbage',
  'wombok': 'napa cabbage',
  'soy': 'soy sauce',
  'light soy sauce': 'soy sauce',
  'dark soy sauce': 'soy sauce',
  'tamari': 'soy sauce',
  'groundnut oil': 'peanut oil',
  'sunflower oil': 'vegetable oil',
  'rapeseed oil': 'vegetable oil',
  'canola oil': 'vegetable oil',
  'ghee': 'ghee',
  'clarified butter': 'ghee',
  'extra virgin olive oil': 'olive oil',
  'evoo': 'olive oil',
  'kosher salt': 'salt',
  'sea salt': 'salt',
  'table salt': 'salt',
  'flaky salt': 'salt',
  'black pepper': 'black pepper',
  'freshly ground black pepper': 'black pepper',
  'ground black pepper': 'black pepper',
  'peppercorns': 'black pepper',
  'runny honey': 'honey',
  'maple': 'maple syrup',
  'white wine vinegar': 'white wine vinegar',
  'cider vinegar': 'apple cider vinegar',
  'rice wine vinegar': 'rice vinegar',
  'store cupboard': 'pantry',
  'tomato purée': 'tomato paste',
  'tomato puree': 'tomato paste',
  'concentrated tomato paste': 'tomato paste',
  'wholegrain mustard': 'whole grain mustard',
  'dijon': 'dijon mustard',
  'english mustard': 'mustard',
  'american mustard': 'mustard',
  'peanut butter': 'peanut butter',
  'smooth peanut butter': 'peanut butter',
  'crunchy peanut butter': 'peanut butter',
  'desiccated coconut': 'shredded coconut',
  'coconut milk (canned)': 'coconut milk',
  'full-fat coconut milk': 'coconut milk',
  'light coconut milk': 'coconut milk',
  'vermicelli': 'rice noodles',
  'rice vermicelli': 'rice noodles',
  'egg noodles': 'egg noodles',
  'spaghetti': 'spaghetti',
  'penne': 'penne pasta',
  'fusilli': 'fusilli pasta',
  'macaroni': 'macaroni',
  'basmati': 'basmati rice',
  'jasmine rice': 'jasmine rice',
  'long-grain rice': 'long-grain white rice',
  'white rice': 'long-grain white rice',
  'arborio': 'arborio rice',
  'wholemeal bread': 'whole wheat bread',
  'wholewheat bread': 'whole wheat bread',
  'streaky bacon': 'bacon',
  'back bacon': 'bacon',
  'pancetta': 'pancetta',
  'chorizo sausage': 'chorizo',
  'feta cheese': 'feta',
  'parmesan cheese': 'parmesan',
  'parmigiano': 'parmesan',
  'parmigiano reggiano': 'parmesan',
  'grana padano': 'parmesan',
  'cheddar cheese': 'cheddar',
  'mature cheddar': 'cheddar',
  'mozzarella cheese': 'mozzarella',
  'paneer cheese': 'paneer',
  'cottage cheese': 'cottage cheese',
  'cream cheese': 'cream cheese',
  'aubergine (eggplant)': 'eggplant',
  'corn tortilla': 'corn tortilla',
  'corn tortillas': 'corn tortilla',
  'flour tortillas': 'tortilla',
  'flour tortilla': 'tortilla',
};

// Staple pantry items assumed present unless the user toggles them off.
// Canonical names only. Matcher treats these as "you already have it".
export const STAPLES = new Set([
  'salt',
  'black pepper',
  'water',
  'olive oil',
  'vegetable oil',
  'sugar',
  'all-purpose flour',
  'butter',
  'garlic',
  'onion',
]);

// Ingredients that make a recipe NON-vegetarian.
export const MEAT_FISH = [
  'chicken','beef','pork','lamb','bacon','ham','sausage','chorizo','pancetta',
  'prosciutto','salami','turkey','duck','veal','mutton','goat',
  'fish','salmon','tuna','cod','haddock','tilapia','mackerel','sardine','anchovy','anchovies',
  'shrimp','prawn','crab','lobster','clam','mussel','oyster','squid','scallop','octopus',
  'ground beef','ground pork','ground lamb','ground chicken','fish sauce',
  'worcestershire sauce','gelatin','gelatine','lard','oyster sauce','shrimp paste',
];

// Non-vegan animal products (beyond MEAT_FISH).
export const ANIMAL_NONVEGAN = [
  'milk','butter','cheese','cheddar','parmesan','mozzarella','feta','paneer','cream cheese',
  'cottage cheese','ricotta','egg','eggs','yogurt','plain yogurt','cream','heavy cream',
  'light cream','sour cream','ghee','honey','buttermilk','condensed milk','evaporated milk',
  'mascarpone','halloumi','gouda','gruyere','yoghurt','custard','ice cream',
];

// Ingredients that (in typical form) contain gluten.
export const GLUTEN = [
  'all-purpose flour','self-rising flour','bread','breadcrumbs','pasta','spaghetti',
  'penne pasta','fusilli pasta','macaroni','egg noodles','flour tortilla','tortilla',
  'couscous','bulgur','barley','wheat','semolina','soy sauce','naan','pita','baguette',
  'pizza dough','puff pastry','filo','phyllo','pastry','noodles','ramen','udon','flour',
  'whole wheat bread','pie crust','pizza base','wonton wrapper','cracker','crackers',
  'plain flour','panko','beer','biscuit','digestive biscuits','pretzel',
];

// Dairy sources (for dairy-free check). Eggs/honey are NOT dairy.
export const DAIRY = [
  'milk','butter','cheese','cheddar','parmesan','mozzarella','feta','paneer','cream cheese',
  'cottage cheese','ricotta','yogurt','plain yogurt','cream','heavy cream','light cream',
  'sour cream','ghee','buttermilk','condensed milk','evaporated milk','mascarpone',
  'halloumi','gouda','gruyere','yoghurt','custard','ice cream',
];

export function canonical(name) {
  const n = name.trim().toLowerCase().replace(/\s+/g, ' ');
  return SYNONYMS[n] || n;
}

// Canonical ingredients that are explicitly SAFE despite containing a
// substring that appears in a restriction list. These override false
// positives from word-boundary matching (e.g. "eggplant" contains "egg";
// "coconut milk" contains "milk"; "rice noodles" contains "noodles").
// Maps a canonical ingredient -> Set of restriction categories it is safe for.
export const SAFE_OVERRIDES = {
  'eggplant': new Set(['vegetarian', 'vegan', 'gluten-free', 'dairy-free']),
  'coconut milk': new Set(['vegetarian', 'vegan', 'gluten-free', 'dairy-free']),
  'rice noodles': new Set(['gluten-free']),
  'rice vinegar': new Set(['gluten-free']),
  'corn tortilla': new Set(['gluten-free']),
  'chickpea flour': new Set(['gluten-free']),
  'cornstarch': new Set(['gluten-free']),
  'cornmeal': new Set(['gluten-free']),
  'peanut butter': new Set(['vegetarian', 'vegan', 'dairy-free']),
  'cocoa powder': new Set(['vegetarian', 'vegan', 'dairy-free']),
  'chocolate chips': new Set(['vegetarian']),
  'buttermilk': new Set([]), // buttermilk IS dairy; listed only to be explicit
};

// Whole-word / phrase membership test with safe-overrides.
// `category` names which restriction we are testing so overrides can apply.
export function matchesAny(name, list, category) {
  const canon = name.toLowerCase();
  const safe = SAFE_OVERRIDES[canon];
  if (safe && category && safe.has(category)) return false;
  const padded = ' ' + canon + ' ';
  return list.some((term) => {
    const t = ' ' + term + ' ';
    return padded.includes(t);
  });
}

// Backwards-compatible alias (no category => no overrides).
export function containsAny(name, list) {
  return matchesAny(name, list, null);
}

export function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
