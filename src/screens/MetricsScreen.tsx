import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Card from '../components/Card';

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

      const { data: rolls } = await supabase
        .from('sparring_log')
        .select('roll_date, submission_landed, submission_received, position_result')
        .eq('user_id', session.user.id);

      const allRolls = rolls ?? [];

      const subsLandedCount = allRolls.filter((r) => r.submission_landed).length;
      setTotalSubs(subsLandedCount);
      setSubmissionRate(allRolls.length > 0 ? (subsLandedCount / allRolls.length) * 100 : 0);

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

      const weekBuckets = [0, 0, 0, 0];
      recentRolls.forEach((r) => {
        if (!isWin(r)) return;
        const daysAgo = Math.floor((now.getTime() - new Date(r.roll_date).getTime()) / (1000 * 60 * 60 * 24));
        const weekIndex = Math.min(3, Math.floor(daysAgo / 7));
        weekBuckets[3 - weekIndex]++;
      });
      setWeeklyWins(weekBuckets);

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
        <p className="font-semibold text-mat-accent text-[11px] uppercase tracking-wide">Tactical Intelligence</p>
        <h1 className="font-extrabold text-mat-text text-2xl">Mat Metrics</h1>
      </div>

      {loading ? (
        <p className="text-mat-faint text-sm">Loading...</p>
      ) : (
        <>
          <div className="flex gap-3">
            <Card className="flex-1 flex flex-col gap-3 p-3.5">
              <p className="text-mat-faint text-[10px]">LIFETIME MAT HOURS</p>
              <p className="text-mat-accent font-extrabold text-3xl">{lifetimeHours.toFixed(1)}</p>
              <p className="text-mat-muted text-xs">+{monthHours.toFixed(1)}h this month</p>
            </Card>
            <Card className="flex-1 flex flex-col gap-3 p-3.5">
              <p className="text-mat-faint text-[10px]">SUBMISSION RATE</p>
              <p className="text-mat-green font-extrabold text-3xl">{submissionRate.toFixed(1)}%</p>
              <p className="text-mat-muted text-xs">{totalSubs} submissions</p>
            </Card>
          </div>

          <Card className="flex flex-col gap-3 p-3.5">
            <p className="text-mat-faint text-[11px]">ROLLING OUTCOMES 60 DAYS</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-mat-text font-extrabold text-xl">{wins} W / {losses} L</p>
                <p className="text-mat-muted text-xs">{neutral} rounds went to distance</p>
              </div>
              <div className="flex gap-1 items-end h-10">
                {weeklyWins.map((count, i) => (
                  <div
                    key={i}
                    className="bg-mat-accent rounded-sm w-2"
                    style={{ height: `${Math.max(4, (count / maxWeekly) * 40)}px` }}
                  />
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            <p className="text-mat-faint text-[11px]">TOP SUBMISSIONS_</p>
            {topSubmissions.length === 0 && (
              <p className="text-mat-faint text-sm">No submissions logged yet.</p>
            )}
            {topSubmissions.map((sub, i) => (
              <Card key={sub.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="text-mat-accent font-extrabold text-sm">#{i + 1}</p>
                    <p className="text-mat-text font-bold text-sm">{sub.name}</p>
                  </div>
                  <p className="text-mat-muted text-[13px]">{sub.count} times Landed</p>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}