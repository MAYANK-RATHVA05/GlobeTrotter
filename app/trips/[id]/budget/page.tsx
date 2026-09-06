'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Table2,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { useTrip } from '@/lib/useTrip';
import { costLabel, costTone, currency, shortDate } from '@/lib/format';
import { TripHeader } from '@/components/TripHeader';
import { Button, Empty, Notice, Spinner } from '@/components/ui';
import { PrivateRoute } from '@/components/AuthGuard';

function BudgetContent() {
  const params = useParams();
  const id = params?.id as string;
  const { trip, setTrip, error } = useTrip(id);
  const [showTable, setShowTable] = useState(false);

  const perStop = useMemo(() => {
    if (!trip) return [];
    return trip.stops.map((stop) => {
      const split = trip.budget.byStop.find((b) => b.stopId === stop.id);
      const activities = Math.round(stop.activities.reduce((sum, a) => sum + Number(a.cost), 0) * trip.travellers);
      const entered = Math.round(
        trip.costs.filter((c) => c.stop_id === stop.id).reduce((sum, c) => sum + Number(c.amount), 0)
      );
      const meals = split?.meals ?? 0;
      return {
        city: stop.city_name,
        days: split?.days ?? 0,
        activities,
        entered,
        meals,
        total: activities + entered + meals,
      };
    });
  }, [trip]);

  if (error) return <Notice>{error}</Notice>;
  if (!trip) return <Spinner label="Calculating the budget breakdown" />;

  const { budget } = trip;

  if (budget.total === 0) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <TripHeader trip={trip} onChange={setTrip} />
        <Empty
          title="No expenses estimated yet"
          body="Add destinations and schedule activities, or enter flight and hotel costs, and your budget analytics will assemble automatically."
          action={
            <Link href={`/trips/${trip.id}/build`}>
              <Button variant="primary">
                <Plus size={15} /> Build Itinerary
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const pieData = budget.breakdown.map((line) => ({
    name: costLabel[line.category] ?? line.category,
    key: line.category,
    value: line.amount,
    estimated: line.estimated,
  }));

  // Target budget cap (simulated realistic baseline if not explicitly set)
  const targetBudgetCap = Math.max(budget.total + 300, Math.ceil(budget.total / 500) * 500);
  const remainingBudget = Math.max(0, targetBudgetCap - budget.total);
  const percentageUsed = Math.min(100, Math.round((budget.total / targetBudgetCap) * 100));

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <TripHeader trip={trip} onChange={setTrip} />

      {/* ------------------------------------------------ Primary Budget Status Card */}
      <section className="card-elevated p-6 sm:p-8 bg-surface rounded-2xl border-rule space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-rule pb-5">
          <div>
            <p className="eyebrow text-brand">Budget Overview</p>
            <h2 className="text-[28px] sm:text-[34px] font-black text-ink tracking-tight">
              Estimated Total: {currency(budget.total)}
            </h2>
            <p className="text-[14px] text-slate mt-0.5">
              Target allowance: {currency(targetBudgetCap)} · {budget.days} days · {budget.travellers} {budget.travellers === 1 ? 'traveller' : 'travellers'}
            </p>
          </div>

          <div className="text-right self-start sm:self-auto">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-[12px] font-bold text-brand uppercase tracking-wider">
              <CheckCircle2 size={13} /> {currency(remainingBudget)} Remaining
            </span>
          </div>
        </div>

        {/* Budget Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-[12.5px] font-semibold text-slate">
            <span>Progress: {percentageUsed}% Allocated</span>
            <span className="font-mono text-ink">{currency(budget.total)} of {currency(targetBudgetCap)}</span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-canvas border border-rule">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand to-emerald-500 transition-all duration-500"
              style={{ width: `${percentageUsed}%` }}
            />
          </div>
        </div>

        {/* 4 Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="card p-4 bg-canvas-subtle">
            <p className="eyebrow text-[10px]">Total Planned</p>
            <p className="num text-[22px] font-black text-ink">{currency(budget.total)}</p>
            <p className="text-[11.5px] text-mist mt-0.5">{budget.days} Days Total</p>
          </div>

          <div className="card p-4 bg-canvas-subtle">
            <p className="eyebrow text-[10px]">Per Person</p>
            <p className="num text-[22px] font-black text-ink">{currency(budget.perTraveller)}</p>
            <p className="text-[11.5px] text-mist mt-0.5">{budget.travellers} Travelling</p>
          </div>

          <div className="card p-4 bg-canvas-subtle">
            <p className="eyebrow text-[10px]">Daily Average</p>
            <p className="num text-[22px] font-black text-brand">{currency(budget.averagePerDay)}</p>
            <p className="text-[11.5px] text-mist mt-0.5">Per Day Allotted</p>
          </div>

          <div className="card p-4 bg-canvas-subtle">
            <p className="eyebrow text-[10px]">Peak Days</p>
            <p className="num text-[22px] font-black text-sunset">{budget.heavyDays.length}</p>
            <p className="text-[11.5px] text-mist mt-0.5">Above Daily Average</p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Donut Chart */}
        <div className="lg:col-span-6 card p-6 bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-ink">Category Allocation</h3>
              <p className="text-[13px] text-slate">Where your budget is distributed</p>
            </div>
            <PieIcon size={18} className="text-brand" />
          </div>

          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry) => (
                    <Cell key={entry.key} fill={costTone[entry.key] || '#0D7A5F'} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [currency(val), 'Amount']}
                  contentStyle={{ borderRadius: '12px', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[11px] font-mono font-bold text-mist uppercase">Total</span>
              <span className="num text-[17px] font-extrabold text-ink">{currency(budget.total)}</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-rule-subtle pt-3">
            {pieData.map((entry) => (
              <div key={entry.key} className="flex items-center justify-between text-[13px]">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: costTone[entry.key] || '#0D7A5F' }}
                  />
                  <span className="text-slate font-medium">{entry.name}</span>
                </div>
                <span className="num font-bold text-ink">{currency(entry.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spending by Stop Bar Chart */}
        <div className="lg:col-span-6 card p-6 bg-surface space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-[18px] font-bold text-ink">Spend by Stop</h3>
              <p className="text-[13px] text-slate">Combined cost for each destination</p>
            </div>
            <TrendingUp size={18} className="text-brand" />
          </div>

          <div className="h-60 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={perStop} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="city" tick={{ fontSize: 12, fill: '#4B5563' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(val: any) => [currency(val), 'Total']}
                  contentStyle={{ borderRadius: '12px', fontSize: '13px' }}
                />
                <Bar dataKey="total" fill="#0D7A5F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-2 border-t border-rule-subtle pt-3">
            {perStop.map((stop) => (
              <div key={stop.city} className="flex items-center justify-between text-[13px]">
                <span className="text-slate font-medium">{stop.city} ({stop.days} days)</span>
                <span className="num font-bold text-ink">{currency(stop.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ Daily Spend Timeline */}
      <section className="card p-6 bg-surface space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-[18px] font-bold text-ink">Daily Spending Timeline</h3>
            <p className="text-[13px] text-slate">
              Red line marks the average daily expense of {currency(budget.averagePerDay)}
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budget.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis
                dataKey="date"
                tickFormatter={(val: any) => shortDate(String(val))}
                tick={{ fontSize: 11, fill: '#9CA3AF' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip
                labelFormatter={(label: any) => shortDate(String(label))}
                formatter={(val: any) => [currency(val), 'Day Cost']}
                contentStyle={{ borderRadius: '12px', fontSize: '13px' }}
              />
              <ReferenceLine
                y={budget.averagePerDay}
                stroke="#DC2626"
                strokeDasharray="3 3"
                label={{ value: 'Avg', fill: '#DC2626', fontSize: 11 }}
              />
              <Bar dataKey="total" fill="#0D7A5F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}

export default function BudgetPage() {
  return (
    <PrivateRoute>
      <BudgetContent />
    </PrivateRoute>
  );
}
