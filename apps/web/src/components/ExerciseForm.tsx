import { useEffect, useMemo, useRef, useState } from 'react';
import { Input, Select } from './Input';
import { Button } from './Button';
import styles from '../styles/components.module.css';
import {
  searchExercises,
  lookupExercise,
  estimateExercise,
} from '../api/exercises';
import type { Intensity } from '../api/exercises';

interface ExerciseFormProps {
  value: {
    name: string;
    duration: string;
    workoutType: 'cardio' | 'strength' | 'flexibility';
    intensity: Intensity;
    caloriesBurned: string;
  };
  onChange: (next: ExerciseFormProps['value']) => void;
  userWeightKg?: number;
}

export default function ExerciseForm({
  value,
  onChange,
  userWeightKg,
}: ExerciseFormProps) {
  const [query, setQuery] = useState(value.name || '');
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [calcLoading, setCalcLoading] = useState(false);

  const [sets, setSets] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [weightUsed, setWeightUsed] = useState<string>('');
  const [tempoSec, setTempoSec] = useState<string>('3');
  const [restSec, setRestSec] = useState<string>('90');

  const strengthDerivedDurationMin = useMemo(() => {
    const s = Math.max(0, parseInt(sets || '0', 10));
    const r = Math.max(0, parseInt(reps || '0', 10));
    const t = Math.max(0, parseFloat(tempoSec || '0'));
    const rest = Math.max(0, parseFloat(restSec || '0'));
    if (!s || !r || !t) return 0;
    const workSec = s * r * t;
    const totalRestSec = s > 1 ? (s - 1) * rest : 0;
    return (workSec + totalRestSec) / 60;
  }, [sets, reps, tempoSec, restSec]);

  const effectiveDurationMin = useMemo(() => {
    if (value.workoutType === 'strength') return strengthDerivedDurationMin;
    const d = parseFloat(value.duration);
    return Number.isFinite(d) && d > 0 ? d : 0;
  }, [value.workoutType, value.duration, strengthDerivedDurationMin]);

  async function doSearch() {
    const q = query.trim();
    if (q.length < 2) return;
    setLoadingSearch(true);
    const list = await searchExercises(q);
    const cleaned = list
      .map((r) => ({ id: r.id, name: String(r.name ?? '').trim() }))
      .filter((r) => r.name.length > 0);
    setResults(cleaned);
    setLoadingSearch(false);
  }

  const seqRef = useRef(0);

  useEffect(() => {
    if (value.workoutType === 'strength') {
      onChange({
        ...value,
        duration: String(Math.round(effectiveDurationMin || 0)),
      });
    }
  }, [effectiveDurationMin]);

  useEffect(() => {
    if (!value.name.trim()) return;
    if (effectiveDurationMin <= 0) return;
    const nextSeq = ++seqRef.current;
    setCalcLoading(true);
    estimateExercise({
      name: value.name.trim(),
      durationMin: effectiveDurationMin,
      weightKg: userWeightKg,
      intensity:
        value.workoutType === 'strength' && Number(restSec) <= 60
          ? 'high'
          : value.intensity,
    })
      .then((data) => {
        if (seqRef.current !== nextSeq) return;
        onChange({
          ...value,
          duration:
            value.workoutType === 'strength'
              ? String(Math.round(effectiveDurationMin))
              : value.duration,
          intensity: data.intensity,
          caloriesBurned: String(data.caloriesBurned ?? value.caloriesBurned),
        });
        setCalcLoading(false);
      })
      .catch(() => setCalcLoading(false));
  }, [
    value.name,
    value.intensity,
    userWeightKg,
    effectiveDurationMin,
    value.workoutType,
    restSec,
  ]);

  return (
    <div>
      <div className={styles['grid-2']}>
        <Select
          label='Workout Type'
          value={value.workoutType}
          onChange={(e) => {
            const nextType = e.target.value as
              | 'cardio'
              | 'strength'
              | 'flexibility';
            setResults([]);
            setQuery(value.name);
            onChange({ ...value, workoutType: nextType });
          }}
          options={[
            { value: 'cardio', label: 'Cardio' },
            { value: 'strength', label: 'Strength' },
            { value: 'flexibility', label: 'Flexibility' },
          ]}
        />
        <Select
          label='Intensity'
          value={value.intensity}
          onChange={(e) =>
            onChange({ ...value, intensity: e.target.value as Intensity })
          }
          options={[
            { value: 'low', label: 'Low' },
            { value: 'moderate', label: 'Moderate' },
            { value: 'high', label: 'High' },
          ]}
        />
      </div>

      {value.workoutType !== 'flexibility' && (
        <>
          <div className={styles.field}>
            <label className={styles['field-label']}>Exercise</label>
            <input
              className={styles.input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder='Search exercises'
            />
            <div className={styles['field-button']}>
              <Button type='button' onClick={doSearch} disabled={loadingSearch}>
                {loadingSearch ? 'Searching...' : 'Search'}
              </Button>
            </div>
          </div>

          {results.length > 0 && (
            <Select
              label='Matches'
              value={value.name}
              onChange={async (e) => {
                const name = e.target.value;
                setQuery(name);
                onChange({ ...value, name });
                const data = await lookupExercise({
                  name,
                  durationMin: effectiveDurationMin || undefined,
                  weightKg: userWeightKg,
                  intensity: value.intensity,
                });
                onChange({
                  ...value,
                  name,
                  intensity: data.intensity,
                  caloriesBurned: String(
                    data.caloriesBurned ?? value.caloriesBurned
                  ),
                });
              }}
              options={results.map((r) => ({ value: r.name, label: r.name }))}
            />
          )}
        </>
      )}

      {value.workoutType === 'cardio' && (
        <div className={styles['grid-2']}>
          <Input
            label='Duration (minutes)'
            type='number'
            value={value.duration}
            onChange={(e) => onChange({ ...value, duration: e.target.value })}
            required
          />
          <Input
            label={
              calcLoading ? 'Calories Burned (calculating…)' : 'Calories Burned'
            }
            type='number'
            value={value.caloriesBurned}
            onChange={(e) =>
              onChange({ ...value, caloriesBurned: e.target.value })
            }
          />
        </div>
      )}

      {value.workoutType === 'strength' && (
        <>
          <div className={styles['grid-3']}>
            <Input
              label='Sets'
              type='number'
              value={sets}
              onChange={(e) => setSets(e.target.value)}
            />
            <Input
              label='Reps'
              type='number'
              value={reps}
              onChange={(e) => setReps(e.target.value)}
            />
            <Input
              label='Weight Used (kg, optional)'
              type='number'
              value={weightUsed}
              onChange={(e) => setWeightUsed(e.target.value)}
            />
          </div>
          <div className={styles['grid-3']}>
            <Input
              label='Tempo (sec/rep)'
              type='number'
              value={tempoSec}
              onChange={(e) => setTempoSec(e.target.value)}
            />
            <Input
              label='Rest Between Sets (sec)'
              type='number'
              value={restSec}
              onChange={(e) => setRestSec(e.target.value)}
            />
            <Input
              label='Derived Duration (min)'
              type='number'
              value={String(Math.round(effectiveDurationMin || 0))}
              onChange={() => {}}
            />
          </div>
          <div className={styles['grid-2']}>
            <Input
              label={
                calcLoading
                  ? 'Calories Burned (calculating…)'
                  : 'Calories Burned'
              }
              type='number'
              value={value.caloriesBurned}
              onChange={(e) =>
                onChange({ ...value, caloriesBurned: e.target.value })
              }
            />
            <Input
              label='Duration (minutes)'
              type='number'
              value={String(Math.round(effectiveDurationMin || 0))}
              onChange={() => {}}
            />
          </div>
        </>
      )}

      {value.workoutType === 'flexibility' && (
        <div className={styles['grid-2']}>
          <Input
            label='Activity Name'
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
          />
          <Input
            label='Duration (minutes)'
            type='number'
            value={value.duration}
            onChange={(e) => onChange({ ...value, duration: e.target.value })}
            required
          />
        </div>
      )}
    </div>
  );
}
