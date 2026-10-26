/* Sign-in screen. Not in the Claude Design file yet (new state, flagged for design): a centred card
   built only from DS components and tokens so it can be redesigned without touching the auth flow. */
import { useState, type FormEvent } from 'react';
import { Button, Input } from '../components/ds';
import { session } from '../data/api';
import { PREF_KEYS, readPref } from '../data/storage';
import { sx } from '../lib/sx';

export function Login({ configured, onSignedIn }: { configured: boolean; onSignedIn: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const pref = readPref(PREF_KEYS.theme);
  const dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password) { setError('Enter your password.'); return; }
    setBusy(true); setError('');
    try { await session.login(password); onSignedIn(); } catch (err) { setError((err as Error).message); } finally { setBusy(false); }
  };
  return (
    <div className={dark ? 'dark' : ''} style={sx('height:100vh;')}>
      <main style={sx("height:100%; display:flex; align-items:center; justify-content:center; padding:16px; background:var(--background); color:var(--foreground); font-family:'Inter', ui-sans-serif, system-ui, sans-serif; font-size:14px; line-height:1.45;")}>
        <form onSubmit={submit} noValidate style={sx('width:360px; max-width:100%; display:flex; flex-direction:column; gap:16px; padding:24px; border:1px solid var(--border); border-radius:14px; background:var(--card); box-shadow:0 1px 2px rgb(0 0 0 / 0.04);')}>
          <div style={sx('display:flex; flex-direction:column; gap:4px;')}>
            <h1 style={sx('margin:0; font-size:20px; font-weight:600; letter-spacing:-0.01em;')}>Design OS</h1>
            <p style={sx('margin:0; font-size:13px; color:var(--muted-foreground);')}>{configured ? 'Enter your password to open your workspace.' : 'Login isn’t configured. Set APP_PASSWORD and SESSION_SECRET in the Vercel project, then redeploy.'}</p>
          </div>
          {configured && (
            <>
              <div style={sx('display:flex; flex-direction:column; gap:6px;')}>
                <label htmlFor="password" style={sx('font-size:13px; font-weight:500;')}>Password</label>
                <Input id="password" type="password" autoComplete="current-password" autoFocus value={password} aria-invalid={!!error} onChange={(e) => setPassword(e.target.value)} />
                <span role="alert" style={sx('font-size:12px; color:var(--destructive);')}>{error}</span>
              </div>
              <Button type="submit" loading={busy}>Sign in</Button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
