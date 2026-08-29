import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';

type Props = { session: Session };

const BELT_BADGE_COLOR: Record<string, string> = {
  white: 'bg-[#3f3f46]',
  blue: 'bg-[#1e3a8a]',
  purple: 'bg-[#581c87]',
  brown: 'bg-[#78350f]',
  black: 'bg-black border border-[#3f3f46]',
};

function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function ProfileScreen({ session }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [gymName, setGymName] = useState('');
  const [belt, setBelt] = useState('white');
  const [stripes, setStripes] = useState(0);
  const [trainingSince, setTrainingSince] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [hasFirstSub, setHasFirstSub] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, gym_name, current_belt, current_stripes, created_at')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || session.user.email?.split('@')[0] || 'Grappler');
        setGymName(profile.gym_name || 'No academy set');
        setBelt(profile.current_belt);
        setStripes(profile.current_stripes);
        setTrainingSince(profile.created_at);
      }

      const { data: promotions } = await supabase
        .from('belt_promotions')
        .select('promotion_date')
        .eq('user_id', session.user.id)
        .order('promotion_date', { ascending: true })
        .limit(1);

      if (promotions && promotions.length > 0) {
        setTrainingSince(promotions[0].promotion_date);
      }

      const { count } = await supabase
        .from('sessions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id);
      setSessionCount(count ?? 0);

      const { count: subCount } = await supabase
        .from('sparring_log')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .not('submission_landed', 'is', null);
      setHasFirstSub((subCount ?? 0) > 0);

      setLoading(false);
    };

    load();
  }, [session.user.id]);

  const achievements = [
    {
      id: 'iron-mat',
      title: 'Iron Mat',
      description: '100 classes logged',
      earned: sessionCount >= 100,
    },
    {
      id: 'first-blood',
      title: 'First Blood',
      description: 'Landed first submission',
      earned: hasFirstSub,
    },
    {
      id: 'consistency',
      title: 'Consistency',
      description: '10+ sessions logged',
      earned: sessionCount >= 10,
    },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-[#e11d48] text-[11px] uppercase tracking-wide">Fighter_Identity</p>
        <h1 className="font-extrabold text-[#f4f4f5] text-2xl">Combat Profile</h1>
      </div>

      {loading ? (
        <p className="text-[#71717a] text-sm">Loading...</p>
      ) : (
        <>
          {/* Identity card */}
          <div className="bg-[#18181b] border border-[#27272a] rounded-2xl p-4 flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-[#3f3f46] flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-extrabold text-[#f4f4f5] text-lg truncate">{displayName}</p>
              <span className={`${BELT_BADGE_COLOR[belt] ?? BELT_BADGE_COLOR.white} inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white`}>
                {belt.toUpperCase()} BELT • {stripes} STRIPE{stripes === 1 ? '' : 'S'}
              </span>
              <p className="text-[#a1a1aa] text-xs truncate">{gymName}</p>
            </div>
          </div>

          {/* Training since + level */}
          <div className="flex gap-3">
            <div className="flex-1 bg-[#18181b] border border-[#27272a] rounded-2xl p-3 flex flex-col gap-3">
              <p className="text-[#71717a] text-[10px]">TRAINING_SINCE</p>
              <p className="text-[#f4f4f5] font-bold text-sm">
                {trainingSince ? formatMonthYear(trainingSince) : 'Not set'}
              </p>
            </div>
            <div className="flex-1 bg-[#18181b] border border-[#27272a] rounded-2xl p-3 flex flex-col gap-3">
              <p className="text-[#71717a] text-[10px]">STRIPES_LEVEL</p>
              <p className="text-[#f4f4f5] font-bold text-sm">Level {stripes}</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="flex flex-col gap-3">
            <p className="text-[#71717a] text-[11px]">BATTLE_ACCOLADES_</p>
            {achievements.map((a) => (
              <div key={a.id} className="bg-[#18181b] border border-[#27272a] rounded-2xl p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        a.earned ? 'bg-[#10b981]/20' : 'bg-[#27272a]'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke={a.earned ? '#10b981' : '#71717a'} strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[#f4f4f5] font-bold text-sm">{a.title}</p>
                      <p className="text-[#a1a1aa] text-xs">{a.description}</p>
                    </div>
                  </div>
                  {a.earned && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}