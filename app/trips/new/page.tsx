'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Compass,
  MapPin,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { currency, dateRange, isoLocal } from '@/lib/format';
import type { Activity, City } from '@/lib/types';
import { Plate } from '@/components/Plate';
import { Button, Fieldset, Input, Notice, Textarea } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

function dayFromNow(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return isoLocal(d);
}

const STEPS = [
  { num: '01', title: 'Trip Details' },
  { num: '02', title: 'Destinations' },
  { num: '03', title: 'Activities' },
  { num: '04', title: 'Budget' },
  { num: '05', title: 'Review' },
];

function CreateTripContent() {
  const router = useRouter();

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(dayFromNow(14));
  const [endDate, setEndDate] = useState(dayFromNow(24));
  const [travellers, setTravellers] = useState(1);
  const [firstCity, setFirstCity] = useState<City | null>(null);
  const [targetBudget, setTargetBudget] = useState('3000');
  const [selectedActivities, setSelectedActivities] = useState<number[]>([]);

  // Catalogue data
  const [cities, setCities] = useState<City[]>([]);
  const [suggestions, setSuggestions] = useState<Activity[]>([]);
  const [citySearch, setCitySearch] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get('/cities', { params: { q: citySearch || undefined, limit: 9, sort: 'popularity' } })
      .then(({ data }) => setCities(data.cities))
      .catch(() => setCities([]));
  }, [citySearch]);

  useEffect(() => {
    if (!firstCity) {
      setSuggestions([]);
      return;
    }
    api
      .get('/activities', { params: { cityId: firstCity.id, limit: 6, sort: 'popularity' } })
      .then(({ data }) => {
        setSuggestions(data.activities);
        // Pre-select the top 2 activities
        setSelectedActivities(data.activities.slice(0, 2).map((a: any) => a.id));
      })
      .catch(() => setSuggestions([]));
  }, [firstCity]);

  const days = useMemo(() => {
    const a = new Date(startDate).getTime();
    const b = new Date(endDate).getTime();
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }, [startDate, endDate]);

  const toggleActivity = (id: number) => {
    setSelectedActivities((curr) =>
      curr.includes(id) ? curr.filter((a) => a !== id) : [...curr, id]
    );
  };

  async function submit() {
    setError('');
    if (endDate < startDate) {
      setError('The end date must come after the start date.');
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post('/trips', {
        name: name || `${firstCity?.name ?? 'World'} Adventure`,
        description,
        startDate,
        endDate,
        travellers,
      });
      const tripId = data.trip.id;

      if (firstCity) {
        const stopRes = await api.post(`/trips/${tripId}/stops`, {
          cityId: firstCity.id,
          startDate,
          endDate,
        });

        const stopId = stopRes.data?.stop?.id;
        if (stopId && selectedActivities.length > 0) {
          // Add selected activities
          for (const actId of selectedActivities) {
            const act = suggestions.find((s) => s.id === actId);
            if (act) {
              await api.post(`/trips/${tripId}/stops/${stopId}/activities`, {
                title: act.name,
                category: act.category,
                cost: act.cost,
                scheduledDate: startDate,
                durationMinutes: act.duration_minutes || 120,
              }).catch(() => {});
            }
          }
        }
      }

      router.push(`/trips/${tripId}/build`);
    } catch (err) {
      setError(errorText(err));
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* ------------------------------------------------ Wizard Header */}
      <div className="text-center space-y-2">
        <p className="eyebrow text-brand">Guided Journey Builder</p>
        <h1 className="text-[30px] sm:text-[38px] font-black tracking-tight text-ink">
          Let&apos;s plan your next adventure.
        </h1>
        <p className="text-[15px] text-slate max-w-lg mx-auto">
          We&apos;ll configure your dates, primary destinations, and budget preferences in five quick steps.
        </p>
      </div>

      {/* ------------------------------------------------ Step Progress Indicator */}
      <div className="card p-3 sm:p-4 bg-surface border-rule">
        <div className="grid grid-cols-5 gap-2 sm:gap-4">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;

            return (
              <button
                key={step.num}
                disabled={idx > currentStep}
                onClick={() => setCurrentStep(idx)}
                className={`flex flex-col sm:flex-row items-center gap-2 p-2 rounded-xl transition-all text-center sm:text-left cursor-pointer ${
                  isCurrent
                    ? 'bg-brand-soft text-brand font-bold'
                    : isDone
                    ? 'text-ink hover:bg-canvas'
                    : 'text-mist cursor-not-allowed opacity-60'
                }`}
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-mono font-bold ${
                    isDone
                      ? 'bg-brand text-white'
                      : isCurrent
                      ? 'bg-brand text-white'
                      : 'bg-sunk text-mist'
                  }`}
                >
                  {isDone ? <Check size={12} strokeWidth={3} /> : step.num}
                </span>
                <span className="text-[12px] sm:text-[13px] truncate hidden md:inline">
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && <Notice>{error}</Notice>}

      {/* ------------------------------------------------ Step Contents */}
      <div className="card-elevated p-6 sm:p-8 bg-surface rounded-2xl border-rule space-y-6">
        {/* STEP 1: Details */}
        {currentStep === 0 && (
          <div className="space-y-5 rise">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Trip Details</h2>
              <p className="text-[14px] text-slate mt-0.5">
                Give your trip a memorable name and set your travel window.
              </p>
            </div>

            <Fieldset label="Trip Name">
              <Input
                required
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Japan Golden Route Explorer"
              />
            </Fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Fieldset label="Start Date">
                <Input
                  required
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Fieldset>

              <Fieldset label="End Date">
                <Input
                  required
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Fieldset>
            </div>

            <div className="flex items-center gap-2 text-[13px] font-semibold text-brand bg-brand-soft px-3 py-2 rounded-xl">
              <Calendar size={15} />
              <span>Calculated duration: {days} days ({dateRange(startDate, endDate)})</span>
            </div>

            <Fieldset label="Trip Description" hint="Optional">
              <Textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is the goal of this journey? Notes on companions, seasons, or places to hit."
              />
            </Fieldset>
          </div>
        )}

        {/* STEP 2: Destinations */}
        {currentStep === 1 && (
          <div className="space-y-5 rise">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Select First Destination</h2>
              <p className="text-[14px] text-slate mt-0.5">
                Where will you land first? You can add and order more stops in the Itinerary Builder.
              </p>
            </div>

            <div className="relative">
              <Input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search cities across the world..."
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 pt-2">
              {cities.map((city) => {
                const isSelected = firstCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setFirstCity(city)}
                    className={`card group overflow-hidden text-left transition-all p-2 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-brand border-brand bg-brand-soft/20 shadow-md'
                        : 'hover:border-gray-400 hover:shadow-sm'
                    }`}
                  >
                    <Plate name={city.name} ratio="aspect-[16/10]" label={city.region} />
                    <div className="pt-2 px-1">
                      <p className="font-bold text-[14.5px] text-ink truncate">{city.name}</p>
                      <p className="text-[12px] text-slate truncate">{city.country}</p>
                      <p className="num text-[11.5px] text-brand font-semibold mt-1">
                        {currency(city.cost_index)}/day
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 3: Activities */}
        {currentStep === 2 && (
          <div className="space-y-5 rise">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Suggested Activities</h2>
              <p className="text-[14px] text-slate mt-0.5">
                {firstCity
                  ? `Popular things to do in ${firstCity.name}. Select activities to schedule into your first stop.`
                  : 'Pick a destination in Step 2 to see top local activity suggestions.'}
              </p>
            </div>

            {suggestions.length === 0 ? (
              <div className="card p-8 text-center text-slate">
                <Compass size={32} className="mx-auto mb-2 text-brand opacity-60" />
                <p>No activity suggestions found for this stop yet. You can add custom ones next!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {suggestions.map((act) => {
                  const isChecked = selectedActivities.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => toggleActivity(act.id)}
                      className={`card p-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all ${
                        isChecked
                          ? 'border-brand bg-brand-soft/30 shadow-xs'
                          : 'hover:border-gray-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <span className="eyebrow text-[10px] text-brand uppercase">{act.category}</span>
                        <h4 className="font-bold text-[14px] text-ink truncate">{act.name}</h4>
                        <p className="text-[12px] text-slate">
                          {act.duration_minutes ? `${Math.round(act.duration_minutes / 60)} hrs` : '2 hrs'} ·{' '}
                          <span className="num font-semibold">{currency(act.cost)}</span>
                        </p>
                      </div>
                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                          isChecked ? 'bg-brand text-white border-brand' : 'border-gray-300'
                        }`}
                      >
                        {isChecked && <Check size={14} />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Budget */}
        {currentStep === 3 && (
          <div className="space-y-5 rise">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Budget & Party</h2>
              <p className="text-[14px] text-slate mt-0.5">
                Configure your target expenditure and companion count.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Fieldset label="Target Total Budget ($ USD)">
                <Input
                  type="number"
                  min={100}
                  step={50}
                  value={targetBudget}
                  onChange={(e) => setTargetBudget(e.target.value)}
                  placeholder="3000"
                />
              </Fieldset>

              <Fieldset label="Number of Travellers">
                <Input
                  type="number"
                  min={1}
                  max={20}
                  value={travellers}
                  onChange={(e) => setTravellers(Number(e.target.value))}
                />
              </Fieldset>
            </div>

            <div className="card p-4 bg-canvas-subtle space-y-2 border-rule">
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-slate">Estimated per-traveller allowance:</span>
                <span className="num font-bold text-ink">
                  {currency(Number(targetBudget || 0) / Math.max(1, travellers))}
                </span>
              </div>
              <div className="flex items-center justify-between text-[13.5px]">
                <span className="text-slate">Estimated daily allowance ({days} days):</span>
                <span className="num font-bold text-brand">
                  {currency(Number(targetBudget || 0) / Math.max(1, days))} / day
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Review */}
        {currentStep === 4 && (
          <div className="space-y-5 rise">
            <div>
              <h2 className="text-[22px] font-bold text-ink">Review Your Journey</h2>
              <p className="text-[14px] text-slate mt-0.5">
                Everything is set. Review your overview before launching into the Itinerary Builder.
              </p>
            </div>

            <div className="card p-5 bg-canvas-subtle space-y-4 border-rule">
              <div className="flex items-center justify-between border-b pb-3">
                <div>
                  <p className="eyebrow text-[10px]">Trip Title</p>
                  <p className="text-[18px] font-bold text-ink">
                    {name || `${firstCity?.name ?? 'World'} Adventure`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="eyebrow text-[10px]">Duration</p>
                  <p className="num font-bold text-brand text-[15px]">{days} Days</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-[13px]">
                <div>
                  <p className="text-mist">Dates</p>
                  <p className="font-semibold text-ink">{dateRange(startDate, endDate)}</p>
                </div>
                <div>
                  <p className="text-mist">First Stop</p>
                  <p className="font-semibold text-ink">{firstCity?.name ?? 'Not selected'}</p>
                </div>
                <div>
                  <p className="text-mist">Travellers</p>
                  <p className="font-semibold text-ink">{travellers} person</p>
                </div>
                <div>
                  <p className="text-mist">Target Budget</p>
                  <p className="font-semibold text-brand">{currency(targetBudget)}</p>
                </div>
              </div>

              {selectedActivities.length > 0 && (
                <div className="border-t pt-3">
                  <p className="eyebrow text-[10px] mb-1.5">Pre-scheduled Activities ({selectedActivities.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedActivities.map((id) => {
                      const act = suggestions.find((s) => s.id === id);
                      return (
                        <span key={id} className="rounded-md bg-surface px-2.5 py-1 text-[12px] font-medium border text-slate">
                          {act?.name ?? 'Activity'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ------------------------------------------------ Navigation Controls */}
        <div className="flex items-center justify-between border-t border-rule-subtle pt-6">
          <Button
            variant="ghost"
            disabled={currentStep === 0}
            onClick={() => setCurrentStep((c) => Math.max(0, c - 1))}
          >
            <ArrowLeft size={15} />
            <span>Previous</span>
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={() => setCurrentStep((c) => Math.min(STEPS.length - 1, c + 1))}
            >
              <span>Next Step</span>
              <ArrowRight size={15} />
            </Button>
          ) : (
            <Button variant="primary" busy={busy} onClick={submit} className="shadow-lg shadow-brand/20">
              <Sparkles size={16} />
              <span>Confirm & Launch Itinerary Builder</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateTripPage() {
  return (
    <PrivateRoute>
      <CreateTripContent />
    </PrivateRoute>
  );
}
