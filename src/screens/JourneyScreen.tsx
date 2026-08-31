import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import PromotionForm from '../PromotionForm';
import PromotionList from '../PromotionList';

type Props = {
  session: Session;
};

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];

const BELT_BAR_COLOR: Record<string, string> = {
  white: 'bg-slate-200',
  blue: 'bg-blue-600',
  purple: 'bg-purple-600',
  brown: 'bg-amber-800',
  black: 'bg-black border border-slate-500',
};

function monthsAtRank(dateStr: string): number {
  const then = new Date(dateStr);
  const now = new Date();
  return (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
}

export default function JourneyScreen({ session }: Props) {
  const [currentBelt, setCurrentBelt] = useState('white');
  const [currentStripes, setCurrentStripes] = useState(0);
  const [latestPromotionDate, setLatestPromotionDate] = useState<string | null>(null);
  const [earnedBelts, setEarnedBelts] = useState<Set<string>>(new Set(['white']));
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('current_belt, current_stripes')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setCurrentBelt(profile.current_belt);
        setCurrentStripes(profile.current_stripes);
      }

      const { data: promotions } = await supabase
        .from('belt_promotions')
        .select('belt, promotion_date')
        .eq('user_id', session.user.id)
        .order('promotion_date', { ascending: false });

      if (promotions && promotions.length > 0) {
        setLatestPromotionDate(promotions[0].promotion_date);
        setEarnedBelts(new Set(['white', ...promotions.map((p) => p.belt)]));
      }

      setLoading(false);
    };

    load();
  }, [session.user.id, refreshKey]);

  const stripePercent = (currentStripes / 4) * 100;
  const barColor = BELT_BAR_COLOR[currentBelt] ?? BELT_BAR_COLOR.white;

  return (
    <div className="flex flex-col gap-6 text-mat-text pb-4">
      <div>
        <p className="text-xs font-semibold text-mat-red tracking-wide">RANK AND PROMOTIONS</p>
        <h1 className="text-2xl font-extrabold">Belt Journey</h1>
      </div>

      <div className="bg-mat-card rounded-2xl p-4 border border-mat-border">
        <div className="flex items-center justify-between mb-2">
          <p className="font-bold text-mat-text">Current Stripes</p>
          <span className="text-sm text-mat-muted">{currentStripes} / 4 STRIPES</span>
        </div>
        <div className="w-full h-3 bg-mat-border rounded-full overflow-hidden">
          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${stripePercent}%` }} />
        </div>
        {!loading && latestPromotionDate && (
          <p className="text-xs text-mat-faint mt-2">
            Time at rank: {monthsAtRank(latestPromotionDate)} months
          </p>
        )}
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-mat-faint mb-2">BELTS</p>
        <div className="flex flex-col gap-2">
          {BELT_ORDER.map((belt) => {
            const isEarned = earnedBelts.has(belt);
            const isCurrent = belt === currentBelt;
            return (
              <div
                key={belt}
                className={`rounded-2xl p-4 flex items-center justify-between border ${
                  isCurrent ? 'bg-[rgba(225,29,72,0.08)] border-[rgba(225,29,72,0.3)]' : 'bg-mat-card border-mat-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      isEarned ? 'bg-mat-red' : 'bg-mat-border'
                    }`}
                  >
                    {isEarned ? '✓' : ''}
                  </div>
                  <div>
                    <p className="font-bold text-mat-text capitalize">{belt} Belt</p>
                    <p className="text-xs text-mat-muted">
                      {isCurrent ? 'Current Rank' : isEarned ? 'Earned' : 'Not yet earned'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <PromotionForm userId={session.user.id} onAdded={() => setRefreshKey((k) => k + 1)} />
      <PromotionList refreshKey={refreshKey} />
    </div>
  );
}