import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import PromotionForm from '../PromotionForm';
import PromotionList from '../PromotionList';

type Props = {
  session: Session;
};

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];

const BELT_STYLES: Record<string, { bar: string; card: string }> = {
  white: { bar: 'bg-slate-200', card: 'bg-slate-800' },
  blue: { bar: 'bg-blue-600', card: 'bg-blue-950/40 border border-blue-900/50' },
  purple: { bar: 'bg-purple-600', card: 'bg-slate-800' },
  brown: { bar: 'bg-amber-800', card: 'bg-slate-800' },
  black: { bar: 'bg-black border border-slate-600', card: 'bg-slate-800' },
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
  const style = BELT_STYLES[currentBelt] ?? BELT_STYLES.white;

  return (
    <div className="flex flex-col gap-6 text-white pb-4">
      <div>
        <p className="text-xs font-semibold text-red-500 tracking-wide">RANK_AND_PROMOTIONS</p>
        <h1 className="text-2xl font-bold">Belt Journey</h1>
      </div>

      {/* Current stripes progress */}
      <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <p className="font-semibold text-white">Current Stripes</p>
          <span className="text-sm text-slate-400">{currentStripes} / 4 STRIPES</span>
        </div>
        <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
          <div className={`h-full ${style.bar} rounded-full transition-all`} style={{ width: `${stripePercent}%` }} />
        </div>
        {!loading && latestPromotionDate && (
          <p className="text-xs text-slate-500 mt-2">
            Time at rank: {monthsAtRank(latestPromotionDate)} months
          </p>
        )}
      </div>

      {/* Belt tier list */}
      <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Stratified_Tiers</p>
        <div className="flex flex-col gap-2">
          {BELT_ORDER.map((belt) => {
            const isEarned = earnedBelts.has(belt);
            const isCurrent = belt === currentBelt;
            const beltStyle = BELT_STYLES[belt];
            return (
              <div
                key={belt}
                className={`rounded-xl p-4 flex items-center justify-between ${
                  isCurrent ? beltStyle.card : 'bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                      isEarned ? 'bg-red-600' : 'bg-slate-700'
                    }`}
                  >
                    {isEarned ? '✓' : ''}
                  </div>
                  <div>
                    <p className="font-semibold text-white capitalize">{belt} Belt</p>
                    <p className="text-xs text-slate-400">
                      {isCurrent ? 'Current Rank' : isEarned ? 'Earned' : 'Not yet earned'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log a promotion */}
      <PromotionForm userId={session.user.id} onAdded={() => setRefreshKey((k) => k + 1)} />
      <PromotionList refreshKey={refreshKey} />
    </div>
  );
}