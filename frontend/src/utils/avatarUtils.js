/**
 * avatarUtils.js
 * Generates deterministic, gender-aware cartoon avatar URLs
 * using the DiceBear API (free, no API key required).
 *
 * ── Style choices ──
 *  • Male   → "adventurer"  – fun boy cartoon face
 *  • Female → "adventurer"  – girl cartoon face (sex[] param)
 *
 * The same name always produces the same avatar (deterministic seed).
 */

/* ── Common feminine first-name stems (lowercase) ── */
const FEMALE_NAMES = new Set([
  'aisha','amrita','ananya','anjali','ankita','anushka','aparna','asha',
  'bhavana','bhavna','deepa','deepika','divya','diya','gauri','geeta',
  'harini','ishita','isha','jaya','jyoti','kajal','kalyani','kavita',
  'kavya','keerthi','khushi','komal','kritika','lakshmi','latika','lavanya',
  'madhuri','manasa','manisha','meena','meera','megha','minal','mira',
  'namrata','nandini','nidhi','nikita','nina','nisha','nithya','nitya',
  'padma','pallavi','payal','pooja','poornima','poonam','preethi','preeti',
  'priya','priyanka','rachana','radha','ranjitha','rashmi','raveena',
  'rekha','renuka','riddhi','ritu','rohini','ruhi','rupali','sadhana',
  'sakshi','sangeetha','sanika','saniya','sanjana','saraswati','savita',
  'seema','shaheen','shakti','shamita','sharda','sheetal','shilpa','shirin',
  'shreya','shruti','siddhi','simran','sneha','soumya','sradha','sreedevi',
  'sridevi','srishti','sruthi','subha','suchitra','sudha','sujatha',
  'sukhpreet','sumita','sunitha','swati','tanvi','taruna','tejal','trishna',
  'usha','varsha','vidya','vijaya','vimala','yasmin','zara','zoya',
  'aaditi','aditi','akriti','alisha','alka','amaya','amisha','anamika',
  'anchal','anjana','anushree','arpita','arya','asmita','avani','babita',
  'barsha','bhumi','chaitra','chandni','charu','chitra','deepali','deepthi',
  'devanshi','dharini','drashti','durga','ekta','esha','falguni',
  'garima','gayathri','gayatri','girija','gunjan','hansika','hema','hemali',
  'himanshi','indira','indu','jhanvi','jhelum','jinal','juhi','kamala',
  'kanchan','karthika','kriti','kumkum','kumud','kunti','lalita','leela',
  'lekha','lena','lipi','lisha','lopa','madhavi','malathi','malati','malar',
  'mamta','manjiri','manjula','manjusha','manorama','maya','nalini','namita',
  'nandhini','naveena','neelam','neelima','neetu','neha','nilima',
  'nirali','nitu','nivedita','padmaja','pamela','pankaja',
  'parvati','poulami','pragati','pragya','prajakta','pratibha','pratima',
  'priyanshi','pushpa','radhika','ragini','rajlakshmi','ramya',
  'ranjana','rati','ratna','reena','renu','revathi','revati','rita',
  'roshni','rupa','rupal','saanvi','sabrina','sai','saira','sakina',
  'saloni','samhitha','samiksha','samridhi','sapna','saraswathi','sarika',
  'saritha','sarvari','saumya','shachi','shakthi','shama','shanta',
  'shanthi','sharmila','sharvari','shashi','shobha','shobhana','shradha',
  'shree','shweta','simi','sirisha','smita','smitha','sonal','sonali',
  'sonam','sophia','srija','srikala','srirupa','srivandhana','stuti',
  'subhashini','sukanya','sulakshana','sulochana','suma','sumana','sunanda',
  'sunita','suparna','sushila','swathi','swathy','tanya','tanaya','tarini',
  'tejashwini','thenmozhi','trupti','tulasi','tulsi','turvi','tvisha',
  'ujjwala','uma','urvashi','urvasi','vanaja','vandana','varalakshmi',
  'vasudhara','veda','vedavathi','veni','vibha','vimla','vinita','vipasha',
  'yamini','yashoda','yashvi','yogita','yukthi',
]);

/**
 * Infer gender from the first word of a name.
 * Returns 'female' for known feminine names, otherwise 'male'.
 */
export function inferGender(name = '') {
  const first = name.trim().split(/\s+/)[0].toLowerCase();
  const stem = first.replace(/(bai|devi|kumari|wati|vati|mati|bhai|ben|amma)$/, '');
  return FEMALE_NAMES.has(first) || FEMALE_NAMES.has(stem) ? 'female' : 'male';
}

/**
 * Returns a cartoon avatar URL (SVG) for a given name.
 * • Male   → adventurer style boy cartoon
 * • Female → adventurer style girl cartoon
 *
 * @param {string} name  – Person's name (used as seed + gender hint)
 * @param {number} size  – Pixel size (default 80)
 * @returns {string}     – Full DiceBear SVG URL
 */
export function getAvatarUrl(name = 'User', size = 80) {
  const gender = inferGender(name);
  const seed = encodeURIComponent(name.trim() || 'user');
  return (
    `https://api.dicebear.com/9.x/adventurer/svg` +
    `?seed=${seed}` +
    `&size=${size}` +
    `&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf` +
    `&backgroundType=solid` +
    `&sex[]=${gender}`
  );
}
