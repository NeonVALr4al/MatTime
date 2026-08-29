import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

type Props = { session: Session };

type RollRow = {
  roll_date: string;
  submission_landed: string | null;
  submission_received: string | null;
  position_result: string | null;
};

function isWin(r: RollRow): boolean {
  if (r.submission_landed) return true;
  if (r.position_result?.startsWith('Won')) return true;
  return false;
}

function isLoss(r: RollRow): boolean {
  if (r.submission_received) return true;
  if (r.position_result?.startsWith('Lost')) return true;
  return false;
}

export default function MetricsScreen({ session }: Props) {
  const [lifetimeHours, setLifetimeHours] = useState(0);
  const [monthHours, setMonthHours] = useState(0);
  const [submissionRate, setSubmissionRate] = useState(0);
  const [totalSubs, setTotalSubs] = useState(0);
  const [wins, setWins] = useState(0);
  const [losses, setLosses] = useState(0);
  const [neutral, setNeutral] = useState(0);
  const [weeklyWins, setWeeklyWins] = useState<number[]>([0, 0, 0, 0]);
  const [topSubmissions, setTopSubmissions] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Lifetime + this-month mat hours
      const { data: sessions } = await supabase
        .from('sessions')
        .select('session_date, duration_minutes')
        .eq('user_id', session.user.id);

      const totalMinutes = (sessions ?? []).reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
      setLifetimeHours(totalMinutes / 60);

      const now = new Date();
      const monthMinutes = (sessions ?? [])
        .filter((s) => {
          const d = new Date(s.session_date);
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        .reduce((sum, s) => sum + (s.duration_minutes ?? 0), 0);
      setMonthHours(monthMinutes / 60);

      // Sparring data
      const { data: rolls } = await supabase
        .from('sparring_log')
        .select('roll_date, submission_landed, submission_received, position_result')
        .eq('user_id', session.user.id);

      const allRolls = rolls ?? [];

      // Submission rate (all-time)
      const subsLandedCount = allRolls.filter((r) => r.submission_landed).length;
      setTotalSubs(subsLandedCount);
      setSubmissionRate(allRolls.length > 0 ? (subsLandedCount / allRolls.length) * 100 : 0);

      // W/L over last 60 days
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const recentRolls = allRolls.filter((r) => new Date(r.roll_date) >= sixtyDaysAgo);

      let w = 0, l = 0, n = 0;
      recentRolls.forEach((r) => {
        if (isWin(r)) w++;
        else if (isLoss(r)) l++;
        else n++;
      });
      setWins(w);
      setLosses(l);
      setNeutral(n);

      // Wins per week, last 4 weeks
      const weekBuckets = [0, 0, 0, 0];
      recentRolls.forEach((r) => {
        if (!isWin(r)) return;
        const daysAgo = Math.floor((now.getTime() - new Date(r.roll_date).getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
        weekBuckets[3 - weekIndex]++;
      });
      setWeeklyWins(weekBuckets);

      // Top submissions
      const counts: Record<string, number> = {};
      allRolls.forEach((r) => {
        if (r.submission_landed) {
          counts[r.submission_landed] = (counts[r.submission_landed] ?? 0) + 1;
        }
      });
      const ranked = Object.entries(counts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);
      setTopSubmissions(ranked);

      setLoading(false);
    };

    load();
  }, [session.user.id]);

  const maxWeekly = Math.max(1, ...weeklyWins);

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-[#e11d48] text-[11px] uppercase tracking-wide">Tactical_Intelligence</p>
        <h1 className="font-extrabold text-[#f4f4f5] text-2xl">Mat Metrics</h1>
      </div>

      {loading ? (
        <p className="text-[#71717a] text-sm">Loading...</p>
      ) : (
        <>
          {/* Top metric cards */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 flex flex-col gap-3">
              <p className="text-[#71717a] text-[10px]">LIFETIME_MAT_HOURS</p>
              <p className="text-[#e11d48] font-extrabold text-3xl">{lifetimeHours.toFixed(1)}</p>
              <p className="text-[#a1a1aa] text-xs">+{monthHours.toFixed(1)}h this month</p>
            </div>
            <div className="flex-1 bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 flex flex-col gap-3">
              <p className="text-[#71717a] text-[10px]">SUBMISSION_RATE</p>
              <p className="text-[#10b981] font-extrabold text-3xl">{submissionRate.toFixed(1)}%</p>
              <p className="text-[#a1a1aa] text-xs">{totalSubs} submissions</p>
            </div>
          </div>

          {/* Rolling outcomes */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3.5 flex flex-col gap-3">
            <p className="text-[#71717a] text-[11px]">ROLLING_OUTCOMES_60_DAYS</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[#f4f4f5] font-extrabold text-xl">{wins} W / {losses} L</p>
                <p className="text-[#a1a1aa] text-xs">{neutral} rounds went to distance</p>
              </div>
              <div className="flex gap-1 items-end h-10">
                {weeklyWins.map((count, i) => (
                  <div
                    key={i}
                    className="bg-[#e11d48] rounded-sm w-2"
                    style={{ height: `${Math.max(4, (count / maxWeekly) * 40)}px` }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Top submissions */}
          <div className="flex flex-col gap-3">
            <p className="text-[#71717a] text-[11px]">TOP_SUBMISSIONS_</p>
            {topSubmissions.length === 0 && (
              <p className="text-[#71717a] text-sm">No submissions logged yet.</p>
            )}
            {topSubmissions.map((sub, i) => (
              <div key={sub.name} className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-[#e11d48] font-extrabold text-sm">#{i + 1}</p>
                    <p className="text-[#f4f4f5] font-bold text-sm">{sub.name}</p>
                  </div>
                  <p className="text-[#a1a1aa] text-[13px]">{sub.count} times Landed</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}