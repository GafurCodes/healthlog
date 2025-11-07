export type Intensity = 'low' | 'moderate' | 'high';

export interface ExerciseSearchItem {
  id: number;
  name: string;
  category?: string;
  equipment?: string[];
  muscles?: string[];
}

const WGER_INFO = 'https://wger.de/api/v2/exerciseinfo/';

export async function searchExercises(
  query: string
): Promise<ExerciseSearchItem[]> {
  const raw = (query || '').trim();
  if (!raw) return [];
  const terms = raw.toLowerCase().split(/\s+/).filter(Boolean);

  async function fetchPage(offset: number) {
    const url = new URL('https://wger.de/api/v2/exerciseinfo/');
    url.searchParams.set('language', '2');
    url.searchParams.set('limit', '100');
    url.searchParams.set('offset', String(offset));
    const res = await fetch(url.toString());
    if (!res.ok) return { results: [], next: null as string | null };
    const data = await res.json();
    return { results: data?.results ?? [], next: data?.next ?? null };
  }

  const collected: any[] = [];
  let offset = 0;
  for (let i = 0; i < 3; i++) {
    const { results, next } = await fetchPage(offset);
    collected.push(...results);
    if (!next) break;
    const m = /offset=(\d+)/.exec(next);
    offset = m ? Number(m[1]) : offset + 100;
    if (collected.length >= 300) break;
  }

  const mapped = collected
    .map((e) => {
      const trs = Array.isArray(e.translations) ? e.translations : [];
      const en = trs.find(
        (t: any) =>
          t?.language === 2 && t?.name && String(t.name).trim().length > 0
      );
      const any = trs.find(
        (t: any) => t?.name && String(t.name).trim().length > 0
      );
      const name = String(en?.name || any?.name || '').trim();
      const category = String(e?.category?.name ?? '').trim();
      const equipment = Array.isArray(e.equipment)
        ? e.equipment.map((x: any) => String(x?.name ?? '')).filter(Boolean)
        : [];
      const muscles = Array.isArray(e.muscles)
        ? e.muscles
            .map((m: any) => String(m?.name_en || m?.name || ''))
            .filter(Boolean)
        : [];
      const haystack = [name, category, ...equipment, ...muscles]
        .join(' ')
        .toLowerCase();
      const ok = terms.every((t) => haystack.includes(t));
      return ok && name
        ? {
            id: e.id,
            name,
            category,
            equipment,
            muscles,
          }
        : null;
    })
    .filter(Boolean) as ExerciseSearchItem[];

  return mapped.slice(0, 20);
}

const METS: Record<string, number> = {
  'running 6 mph': 9.8,
  'running 7 mph': 11.5,
  'walking 3 mph': 3.3,
  'cycling 10-11.9 mph': 6.8,
  'cycling <10 mph leisure': 4.0,
  'jump rope fast': 12.3,
  'elliptical moderate': 5.0,
  'strength training general': 6.0,
  'yoga hatha': 2.5,
  'swimming laps moderate': 6.0,
  'swimming laps vigorous': 8.3,
};

export function classifyIntensity(met: number): Intensity {
  if (met < 3) return 'low';
  if (met < 6) return 'moderate';
  return 'high';
}

function intensityToDefaultMet(intensity?: Intensity): number {
  if (intensity === 'low') return 2.5;
  if (intensity === 'moderate') return 4.5;
  if (intensity === 'high') return 7.0;
  return 4.0;
}

export function guessMetFromName(name: string, intensity?: Intensity): number {
  const n = (name || '').trim().toLowerCase();
  if (!n) return intensityToDefaultMet(intensity);
  if (METS[n]) return METS[n];
  if (/\brun(ning)?\b/.test(n)) return intensity === 'high' ? 11 : 8;
  if (/\bwalk(ing)?\b/.test(n)) return intensity === 'high' ? 4 : 3.3;
  if (/\bcycle|bik(ing|e)\b/.test(n)) return intensity === 'high' ? 8 : 6.5;
  if (/\bswim(ming)?\b/.test(n)) return intensity === 'high' ? 8.3 : 6;
  if (/\brow(ing)?\b/.test(n)) return intensity === 'high' ? 8 : 5;
  if (/\belliptical\b/.test(n)) return 5;
  if (/\bjump(\s|-)rope\b/.test(n)) return intensity === 'high' ? 12 : 10;
  if (/\byoga\b/.test(n)) return 2.5;
  if (/\bstreng(th)?|weight(s)?|resistance\b/.test(n)) return 6.0;
  if (/\bpilates\b/.test(n)) return 3.0;
  if (/\bhike|trail\b/.test(n)) return 6.0;
  if (/\bhiit|interval\b/.test(n)) return 8.0;
  return intensityToDefaultMet(intensity);
}

export function estimateCalories(
  met: number,
  weightKg: number,
  durationMin: number
): number {
  const hours = Math.max(0, durationMin) / 60;
  const kcal = met * Math.max(0, weightKg) * hours;
  return Math.round(kcal);
}

export interface EstimateInput {
  name: string;
  durationMin: number;
  weightKg?: number;
  intensity?: Intensity;
}

export interface EstimateOutput {
  met: number;
  intensity: Intensity;
  caloriesBurned: number;
}

export function estimateCaloriesForExercise(
  input: EstimateInput,
  defaultWeightKg = 75
): EstimateOutput {
  const met = guessMetFromName(input.name, input.intensity);
  const inferredIntensity = classifyIntensity(met);
  const weight =
    Number.isFinite(input.weightKg) && input.weightKg! > 0
      ? input.weightKg!
      : defaultWeightKg;
  const caloriesBurned = estimateCalories(met, weight, input.durationMin);
  return { met, intensity: inferredIntensity, caloriesBurned };
}

export interface ExerciseDetailsInput {
  name: string;
  durationMin?: number;
  weightKg?: number;
  intensity?: Intensity;
}

export interface ExerciseDetailsOutput {
  id?: number;
  name: string;
  category?: string;
  equipment?: string[];
  muscles?: string[];
  workoutType: 'cardio' | 'strength' | 'flexibility';
  met: number;
  intensity: Intensity;
  caloriesBurned?: number;
}

export async function lookupExerciseDetails(
  input: ExerciseDetailsInput,
  defaultWeightKg = 75
): Promise<ExerciseDetailsOutput | null> {
  const q = (input.name || '').trim();
  if (!q) return null;
  const list = await searchExercises(q);
  const best = list[0];
  const name = best?.name || q;
  const cat = (best?.category || '').toLowerCase();
  let workoutType: 'cardio' | 'strength' | 'flexibility' = 'strength';
  if (
    /(run|walk|cycle|bike|elliptical|row|swim|cardio|aerobic)/i.test(name) ||
    /(cardio)/i.test(cat)
  )
    workoutType = 'cardio';
  if (/(yoga|stretch|mobility|pilates|flexibility)/i.test(name))
    workoutType = 'flexibility';
  const met = guessMetFromName(name, input.intensity);
  const intensity = classifyIntensity(met);
  const caloriesBurned =
    input.durationMin && (input.weightKg || defaultWeightKg)
      ? estimateCalories(
          met,
          input.weightKg || defaultWeightKg,
          input.durationMin
        )
      : undefined;
  return {
    id: best?.id,
    name,
    category: best?.category,
    equipment: best?.equipment || [],
    muscles: best?.muscles || [],
    workoutType,
    met,
    intensity,
    caloriesBurned,
  };
}
