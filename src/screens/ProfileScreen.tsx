import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Card from '../components/Card';

type Props = { session: Session };

const BELT_BADGE_COLOR: Record<string, string> = {
  white: 'bg-[#3f3f46]',
  blue: 'bg-[#1e3a8a]',
  purple: 'bg-[#581c87]',
  brown: 'bg-[#78350f]',
  black: 'bg-black border border-mat-border-strong',
};

function formatMonthYear(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfileScreen({ session }: Props) {
  const [displayName, setDisplayName] = useState('');
  const [gymName, setGymName] = useState('');
  const [belt, setBelt] = useState('white');
  const [stripes, setStripes] = useState(0);
  const [trainingSince, setTrainingSince] = useState<string | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [hasFirstSub, setHasFirstSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [editingGym, setEditingGym] = useState(false);
  const [gymInput, setGymInput] = useState('');
  const [savingGym, setSavingGym] = useState(false);
  const [gymError, setGymError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, gym_name, current_belt, current_stripes, created_at, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || session.user.email?.split('@')[0] || 'Grappler');
        setGymName(profile.gym_name || '');
        setBelt(profile.current_belt);
        setStripes(profile.current_stripes);
        setTrainingSince(profile.created_at);
        setAvatarUrl(profile.avatar_url);
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setAvatarError('');

    if (!file.type.startsWith('image/')) {
      setAvatarError('Please choose an image file.');
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError('Image must be under 5MB.');
      return;
    }

    setUploadingAvatar(true);

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `${session.user.id}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setUploadingAvatar(false);
      setAvatarError(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(path);
    const publicUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('id', session.user.id);

    setUploadingAvatar(false);

    if (updateError) {
      setAvatarError(updateError.message);
      return;
    }

    setAvatarUrl(publicUrl);
  };

  const startEditingGym = () => {
    setGymError('');
    setGymInput(gymName);
    setEditingGym(true);
  };

  const cancelEditingGym = () => {
    setEditingGym(false);
    setGymError('');
  };

  const handleSaveGym = async () => {
    setGymError('');
    setSavingGym(true);

    const trimmed = gymInput.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ gym_name: trimmed || null })
      .eq('id', session.user.id);

    setSavingGym(false);

    if (error) {
      setGymError(error.message);
      return;
    }

    setGymName(trimmed);
    setEditingGym(false);
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      alert(`Failed to sign out: ${error.message}`);
    }
  };

  const achievements = [
    { id: 'iron-mat', title: 'Iron Mat', description: '100 classes logged', earned: sessionCount >= 100 },
    { id: 'first-blood', title: 'First Blood', description: 'Landed first submission', earned: hasFirstSub },
    { id: 'consistency', title: 'Consistency', description: '10+ sessions logged', earned: sessionCount >= 10 },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-mat-red text-[11px] uppercase tracking-wide">Fighter Identity</p>
        <h1 className="font-extrabold text-mat-text text-2xl">Combat Profile</h1>
      </div>

      {loading ? (
        <p className="text-mat-faint text-sm">Loading...</p>
      ) : (
        <>
          <Card className="flex gap-4 items-center">
            <div className="relative w-16 h-16 flex-shrink-0">
              <div className="w-16 h-16 rounded-full bg-[#3f3f46] overflow-hidden flex items-center justify-center text-xl font-bold text-white">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  displayName.charAt(0).toUpperCase()
                )}
              </div>
              <label
                htmlFor="avatar-upload"
                aria-label="Change profile picture"
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mat-red border-2 border-mat-card flex items-center justify-center cursor-pointer transition-opacity ${
                  uploadingAvatar ? 'opacity-50 pointer-events-none' : 'hover:opacity-90'
                }`}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-3 h-3">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="13" r="4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
                disabled={uploadingAvatar}
              />
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <p className="font-extrabold text-mat-text text-lg truncate">{displayName}</p>
              <div className="flex items-center gap-1.5">
                <span className={`${BELT_BADGE_COLOR[belt] ?? BELT_BADGE_COLOR.white} inline-block w-fit px-2 py-0.5 rounded text-[10px] font-bold text-white`}>
                  {belt.toUpperCase()} BELT
                </span>
                <div
                  className="flex items-center gap-[3px] bg-black rounded-[2px] px-1.5 py-1"
                  aria-label={`${stripes} stripe${stripes === 1 ? '' : 's'}`}
                  title={`${stripes} stripe${stripes === 1 ? '' : 's'}`}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <span
                      key={i}
                      className={`w-[3px] h-3 rounded-[1px] ${i < stripes ? 'bg-white' : 'bg-white/15'}`}
                    />
                  ))}
                </div>
              </div>
              {avatarError && <p className="text-red-400 text-xs mt-1">{avatarError}</p>}
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              aria-label="Sign out"
              className="ml-auto flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg text-mat-muted hover:text-mat-red hover:bg-[rgba(255,46,85,0.13)] disabled:opacity-40 transition-all duration-200 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </Card>

          <div className="flex gap-3">
            <Card className="flex-1 flex flex-col gap-3">
              <p className="text-mat-faint text-[10px]">TRAINING SINCE</p>
              <p className="text-mat-text font-bold text-sm">
                {trainingSince ? formatMonthYear(trainingSince) : 'Not set'}
              </p>
            </Card>
            <Card className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-mat-faint text-[10px]">ACADEMY</p>
                {!editingGym && (
                  <button
                    type="button"
                    onClick={startEditingGym}
                    aria-label="Edit academy"
                    className="text-mat-faint hover:text-mat-red transition-colors flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              {editingGym ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="text"
                    value={gymInput}
                    onChange={(e) => setGymInput(e.target.value)}
                    placeholder="Your academy name"
                    autoFocus
                    disabled={savingGym}
                    className="w-full min-h-[32px] rounded-md bg-mat-bg text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-red"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveGym}
                      disabled={savingGym}
                      className="flex-1 min-h-[28px] bg-mat-red hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-opacity"
                    >
                      {savingGym ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingGym}
                      disabled={savingGym}
                      className="flex-1 min-h-[28px] bg-mat-bg border border-mat-border-strong text-mat-muted text-xs font-semibold rounded-md hover:text-mat-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {gymError && <p className="text-red-400 text-xs">{gymError}</p>}
                </div>
              ) : (
                <p className="text-mat-text font-bold text-sm truncate">{gymName || 'No academy set'}</p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-mat-faint text-[11px]">BATTLE ACCOLADES </p>
            {achievements.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                        a.earned ? 'bg-mat-green/20' : 'bg-mat-border-strong'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke={a.earned ? '#10b981' : '#9a9ba3'} strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-mat-text font-bold text-sm">{a.title}</p>
                      <p className="text-mat-muted text-xs">{a.description}</p>
                    </div>
                  </div>
                  {a.earned && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}