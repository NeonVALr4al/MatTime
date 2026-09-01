import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import PromotionForm from '../PromotionForm';
import PromotionList from '../PromotionList';
import { BELT_COLOR, TIP_COLOR } from '../beltColors';

type Props = {
  session: Session;
};

const BELT_ORDER = ['white', 'blue', 'purple', 'brown', 'black'];

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

      setLatestPromotionDate(promotions && promotions.length > 0 ? promotions[0].promotion_date : null);
      setEarnedBelts(new Set(['white', ...(promotions ?? []).map((p) => p.belt)]));

      setLoading(false);
    };

    load();
  }, [session.user.id, refreshKey]);

  return (
    <div className="flex flex-col gap-6 text-mat-text pb-4">
      <div>
        <p className="text-xs font-semibold text-mat-accent tracking-wide">RANK AND PROMOTIONS</p>
        <h1 className="text-2xl font-extrabold">Belt Journey</h1>
      </div>

      <div className="bg-mat-card rounded-2xl p-4 border border-mat-border">
        <p className="font-bold text-mat-text mb-3">Current Rank</p>
        <div className={`relative w-full h-7 rounded-lg overflow-hidden ${BELT_COLOR[currentBelt] ?? BELT_COLOR.white}`}>
          <div
            className={`absolute right-0 top-0 h-full flex items-center gap-1 px-2 ${TIP_COLOR[currentBelt] ?? 'bg-black'}`}
            aria-label={`${currentStripes} stripe${currentStripes === 1 ? '' : 's'}`}
            title={`${currentStripes} stripe${currentStripes === 1 ? '' : 's'}`}
          >
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`w-1 h-4 rounded-[1px] ${i < currentStripes ? 'bg-white' : 'bg-white/15'}`}
              />
            ))}
          </div>
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
                className={`rounded-2xl p-3 flex items-center gap-4 border ${
                  isCurrent ? 'bg-mat-accent-fill border-mat-accent-border' : 'bg-mat-card border-mat-border'
                }`}
              >
                <div className={`relative flex-1 h-10 rounded-lg overflow-hidden ${BELT_COLOR[belt] ?? BELT_COLOR.white}`}>
                  <div
                    className={`absolute right-0 top-0 h-full flex items-center gap-1 px-2.5 ${TIP_COLOR[belt] ?? 'bg-black'}`}
                    aria-label={`${belt} belt stripe tip`}
                  >
                    {[0, 1, 2, 3].map((i) => {
                      const filled = isCurrent ? i < currentStripes : isEarned;
                      return (
                        <span
                          key={i}
                          className={`w-1 h-5 rounded-[1px] ${filled ? 'bg-white' : 'bg-white/15'}`}
                        />
                      );
                    })}
                  </div>
                </div>
                <p className="text-sm text-mat-muted flex-shrink-0 whitespace-nowrap">
                  {isCurrent ? 'Current Rank' : isEarned ? 'Earned' : 'Not yet earned'}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <PromotionForm userId={session.user.id} onAdded={() => setRefreshKey((k) => k + 1)} />
      <PromotionList
        userId={session.user.id}
        refreshKey={refreshKey}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </div>
  );
}