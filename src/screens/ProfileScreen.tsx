import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Card from '../components/Card';
import PositionMatrixModal from '../components/PositionMatrixModal';
import TrophyCase from '../components/TrophyCase';
import { BELT_COLOR, TIP_COLOR } from '../beltColors';
import type { Theme } from '../hooks/useTheme';
import { useToast } from '../hooks/useToast';
import { formatMonthYear, toUrl } from '../utils/date';

type Props = { session: Session; theme: Theme; onToggleTheme: () => void };

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export default function ProfileScreen({ session, theme, onToggleTheme }: Props) {
  const { showToast } = useToast();
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');
  const [gymName, setGymName] = useState('');
  const [gymUrl, setGymUrl] = useState('');
  const [belt, setBelt] = useState('white');
  const [stripes, setStripes] = useState(0);
  const [trainingSince, setTrainingSince] = useState<string | null>(null);
  const [trainingSinceOverride, setTrainingSinceOverride] = useState<string | null>(null);
  const [editingTrainingSince, setEditingTrainingSince] = useState(false);
  const [trainingSinceInput, setTrainingSinceInput] = useState('');
  const [savingTrainingSince, setSavingTrainingSince] = useState(false);
  const [trainingSinceError, setTrainingSinceError] = useState('');
  const [sessionCount, setSessionCount] = useState(0);
  const [hasFirstSub, setHasFirstSub] = useState(false);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [editingGym, setEditingGym] = useState(false);
  const [gymInput, setGymInput] = useState('');
  const [gymUrlInput, setGymUrlInput] = useState('');
  const [savingGym, setSavingGym] = useState(false);
  const [gymError, setGymError] = useState('');
  const [showTrophyCase, setShowTrophyCase] = useState(false);
  const [showPositionMatrix, setShowPositionMatrix] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, gym_name, gym_url, current_belt, current_stripes, created_at, avatar_url, training_since')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || session.user.email?.split('@')[0] || 'Grappler');
        setGymName(profile.gym_name || '');
        setGymUrl(profile.gym_url || '');
        setBelt(profile.current_belt);
        setStripes(profile.current_stripes);
        setTrainingSinceOverride(profile.training_since);
        setTrainingSince(profile.training_since || profile.created_at);
        setAvatarUrl(profile.avatar_url);
      }

      const { data: promotions } = await supabase
        .from('belt_promotions')
        .select('promotion_date')
        .eq('user_id', session.user.id)
        .order('promotion_date', { ascending: true })
        .limit(1);

      if (!profile?.training_since && promotions && promotions.length > 0) {
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
    showToast('Profile picture updated.');
  };

  const startEditingName = () => {
    setNameError('');
    setNameInput(displayName);
    setEditingName(true);
  };

  const cancelEditingName = () => {
    setEditingName(false);
    setNameError('');
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      setNameError('Name cannot be empty.');
      return;
    }

    setNameError('');
    setSavingName(true);

    const { error } = await supabase
      .from('profiles')
      .update({ display_name: trimmed })
      .eq('id', session.user.id);

    setSavingName(false);

    if (error) {
      setNameError(error.message);
      return;
    }

    setDisplayName(trimmed);
    setEditingName(false);
    showToast('Name updated.');
  };

  const startEditingGym = () => {
    setGymError('');
    setGymInput(gymName);
    setGymUrlInput(gymUrl);
    setEditingGym(true);
  };

  const cancelEditingGym = () => {
    setEditingGym(false);
    setGymError('');
  };

  const handleSaveGym = async () => {
    setGymError('');
    setSavingGym(true);

    const trimmedName = gymInput.trim();
    const trimmedUrl = gymUrlInput.trim();
    const { error } = await supabase
      .from('profiles')
      .update({ gym_name: trimmedName || null, gym_url: trimmedUrl ? toUrl(trimmedUrl) : null })
      .eq('id', session.user.id);

    setSavingGym(false);

    if (error) {
      setGymError(error.message);
      return;
    }

    setGymName(trimmedName);
    setGymUrl(trimmedUrl ? toUrl(trimmedUrl) : '');
    setEditingGym(false);
    showToast('Academy updated.');
  };

  const startEditingTrainingSince = () => {
    setTrainingSinceError('');
    setTrainingSinceInput(trainingSinceOverride ?? trainingSince ?? new Date().toISOString().split('T')[0]);
    setEditingTrainingSince(true);
  };

  const cancelEditingTrainingSince = () => {
    setEditingTrainingSince(false);
    setTrainingSinceError('');
  };

  const handleSaveTrainingSince = async () => {
    setTrainingSinceError('');
    setSavingTrainingSince(true);

    const { error } = await supabase
      .from('profiles')
      .update({ training_since: trainingSinceInput || null })
      .eq('id', session.user.id);

    setSavingTrainingSince(false);

    if (error) {
      setTrainingSinceError(error.message);
      return;
    }

    setTrainingSinceOverride(trainingSinceInput || null);
    setTrainingSince(trainingSinceInput || null);
    setEditingTrainingSince(false);
    showToast('Training since date updated.');
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      setSigningOut(false);
      showToast(`Failed to sign out: ${error.message}`, 'error');
    }
  };

  const startEditingPassword = () => {
    setPasswordError('');
    setPasswordSuccess('');
    setNewPassword('');
    setConfirmPassword('');
    setEditingPassword(true);
  };

  const cancelEditingPassword = () => {
    setEditingPassword(false);
    setPasswordError('');
  };

  const handleSavePassword = async () => {
    setPasswordError('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPassword(false);

    if (error) {
      setPasswordError(error.message);
      return;
    }

    setNewPassword('');
    setConfirmPassword('');
    setEditingPassword(false);
    setPasswordSuccess('Password updated.');
  };

  const achievements = [
    { id: 'iron-mat', title: 'Iron Mat', description: '100 classes logged', earned: sessionCount >= 100 },
    { id: 'first-blood', title: 'First Blood', description: 'Landed first submission', earned: hasFirstSub },
    { id: 'consistency', title: 'Consistency', description: '10+ sessions logged', earned: sessionCount >= 10 },
  ];

  return (
    <div className="flex flex-col gap-5 pb-4">
      <div className="flex flex-col gap-1">
        <p className="font-semibold text-mat-accent text-[11px] uppercase tracking-wide">Fighter Identity</p>
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
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-mat-accent border-2 border-mat-card flex items-center justify-center cursor-pointer transition-opacity ${
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
              {editingName ? (
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Display name"
                      autoFocus
                      disabled={savingName}
                      className="flex-1 min-w-0 min-h-[32px] rounded-md bg-mat-fill text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
                    />
                    <button
                      type="button"
                      onClick={handleSaveName}
                      disabled={savingName}
                      className="min-h-[32px] px-3 bg-mat-accent-strong hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-opacity"
                    >
                      {savingName ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingName}
                      disabled={savingName}
                      className="min-h-[32px] px-3 bg-mat-fill border border-mat-border-strong text-mat-muted text-xs font-semibold rounded-md hover:text-mat-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {nameError && <p className="text-red-400 text-xs">{nameError}</p>}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-mat-text text-lg truncate">{displayName}</p>
                  <button
                    type="button"
                    onClick={startEditingName}
                    aria-label="Edit display name"
                    className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent transition-colors flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`relative w-28 h-6 rounded-md overflow-hidden ${BELT_COLOR[belt] ?? BELT_COLOR.white}`}
                  aria-label={`${belt} belt, ${stripes} stripe${stripes === 1 ? '' : 's'}`}
                >
                  <div className={`absolute right-0 top-0 h-full flex items-center gap-[3px] px-1.5 ${TIP_COLOR[belt] ?? 'bg-black'}`}>
                    {[0, 1, 2, 3].map((i) => (
                      <span
                        key={i}
                        className={`w-[3px] h-3 rounded-[1px] ${i < stripes ? 'bg-white' : 'bg-white/15'}`}
                      />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTrophyCase(true)}
                  aria-label="Open competition trophy case"
                  className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent transition-colors flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7 5H4a1 1 0 0 0-1 1v1a4 4 0 0 0 4 4M17 5h3a1 1 0 0 1 1 1v1a4 4 0 0 1-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPositionMatrix(true)}
                  aria-label="Open position matrix radar chart"
                  className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent transition-colors flex-shrink-0"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="5.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M12 3v3M12 18v3M21 12h-3M6 12H3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {avatarError && <p className="text-red-400 text-xs mt-1">{avatarError}</p>}
            </div>
            <div className="ml-auto flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={onToggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="w-11 h-11 flex items-center justify-center rounded-lg text-mat-muted hover:text-mat-accent hover:bg-mat-accent-fill transition-all duration-200 active:scale-[0.98]"
              >
                {theme === 'dark' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" strokeLinecap="round" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                aria-label="Sign out"
                className="w-11 h-11 flex items-center justify-center rounded-lg text-mat-muted hover:text-mat-accent hover:bg-mat-accent-fill disabled:opacity-40 transition-all duration-200 active:scale-[0.98]"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </Card>

          <div className="flex gap-3">
            <Card className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-mat-faint text-[10px]">TRAINING SINCE</p>
                {!editingTrainingSince && (
                  <button
                    type="button"
                    onClick={startEditingTrainingSince}
                    aria-label="Edit training since"
                    className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent transition-colors flex-shrink-0"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              {editingTrainingSince ? (
                <div className="flex flex-col gap-1.5">
                  <input
                    type="date"
                    value={trainingSinceInput}
                    onChange={(e) => setTrainingSinceInput(e.target.value)}
                    autoFocus
                    disabled={savingTrainingSince}
                    min="1950-01-01"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full min-h-[32px] rounded-md bg-mat-fill text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveTrainingSince}
                      disabled={savingTrainingSince}
                      className="flex-1 min-h-[28px] bg-mat-accent-strong hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-opacity"
                    >
                      {savingTrainingSince ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingTrainingSince}
                      disabled={savingTrainingSince}
                      className="flex-1 min-h-[28px] bg-mat-fill border border-mat-border-strong text-mat-muted text-xs font-semibold rounded-md hover:text-mat-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {trainingSinceError && <p className="text-red-400 text-xs">{trainingSinceError}</p>}
                </div>
              ) : (
                <p className="text-mat-text font-bold text-sm">
                  {trainingSince ? formatMonthYear(trainingSince) : 'Not set'}
                </p>
              )}
            </Card>
            <Card className="flex-1 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-mat-faint text-[10px]">ACADEMY</p>
                {!editingGym && (
                  <button
                    type="button"
                    onClick={startEditingGym}
                    aria-label="Edit academy"
                    className="p-1.5 -m-1.5 text-mat-faint hover:text-mat-accent transition-colors flex-shrink-0"
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
                    placeholder="Academy name"
                    autoFocus
                    disabled={savingGym}
                    className="w-full min-h-[32px] rounded-md bg-mat-fill text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
                  />
                  <input
                    type="text"
                    value={gymUrlInput}
                    onChange={(e) => setGymUrlInput(e.target.value)}
                    placeholder="Link, e.g. instagram.com/yourgym"
                    disabled={savingGym}
                    className="w-full min-h-[32px] rounded-md bg-mat-fill text-mat-text px-2 text-sm outline-none border border-mat-border-strong focus:border-mat-accent"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSaveGym}
                      disabled={savingGym}
                      className="flex-1 min-h-[28px] bg-mat-accent-strong hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-opacity"
                    >
                      {savingGym ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingGym}
                      disabled={savingGym}
                      className="flex-1 min-h-[28px] bg-mat-fill border border-mat-border-strong text-mat-muted text-xs font-semibold rounded-md hover:text-mat-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {gymError && <p className="text-red-400 text-xs">{gymError}</p>}
                </div>
              ) : gymName && gymUrl ? (
                <a
                  href={gymUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-mat-accent font-bold text-sm truncate hover:underline"
                >
                  {gymName}
                </a>
              ) : (
                <p className="text-mat-text font-bold text-sm truncate">{gymName || 'No academy set'}</p>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-mat-faint text-[11px]">ACCOUNT SECURITY</p>
            <Card className="flex flex-col gap-3">
              {editingPassword ? (
                <div className="flex flex-col gap-2">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    autoFocus
                    disabled={savingPassword}
                    className="w-full min-h-[40px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-3 text-sm outline-none border border-mat-border-strong focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    disabled={savingPassword}
                    className="w-full min-h-[40px] rounded-lg bg-mat-fill text-mat-text placeholder-mat-faint px-3 text-sm outline-none border border-mat-border-strong focus:border-mat-accent focus:ring-1 focus:ring-mat-accent/20"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={savingPassword}
                      className="flex-1 min-h-[36px] bg-mat-accent-strong hover:bg-mat-accent-hover disabled:opacity-40 text-white text-xs font-semibold rounded-md transition-colors"
                    >
                      {savingPassword ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditingPassword}
                      disabled={savingPassword}
                      className="flex-1 min-h-[36px] bg-mat-fill border border-mat-border-strong text-mat-muted text-xs font-semibold rounded-md hover:text-mat-text transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {passwordError && <p className="text-red-400 text-xs">{passwordError}</p>}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-mat-text font-bold text-sm">Password</p>
                    <p className="text-mat-muted text-xs">••••••••</p>
                    {passwordSuccess && <p className="text-mat-green text-xs mt-1">{passwordSuccess}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={startEditingPassword}
                    className="text-xs font-semibold text-mat-accent hover:underline flex-shrink-0"
                  >
                    Change
                  </button>
                </div>
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
                        a.earned ? 'bg-mat-green/20 text-mat-green' : 'bg-mat-border-strong text-mat-faint'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-mat-text font-bold text-sm">{a.title}</p>
                      <p className="text-mat-muted text-xs">{a.description}</p>
                    </div>
                  </div>
                  {a.earned && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4 flex-shrink-0 text-mat-green">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {showTrophyCase && (
        <TrophyCase userId={session.user.id} onClose={() => setShowTrophyCase(false)} />
      )}

      {showPositionMatrix && (
        <PositionMatrixModal userId={session.user.id} onClose={() => setShowPositionMatrix(false)} />
      )}
    </div>
  );
}