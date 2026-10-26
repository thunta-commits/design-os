import { StrictMode, useCallback, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { Login } from './app/Login';
import { Shell } from './app/Shell';
import { AppProvider } from './app/store';
import { Loading } from './components/ui';
import { SAMPLE_MODE } from './config';
import { session } from './data/api';

type Auth = { status: 'checking' } | { status: 'signed-out'; configured: boolean; serverError?: string } | { status: 'signed-in' };

function App() {
  const [auth, setAuth] = useState<Auth>(SAMPLE_MODE ? { status: 'signed-in' } : { status: 'checking' });
  const check = useCallback(() => {
    session.get()
      .then((s) => setAuth(s.authenticated ? { status: 'signed-in' } : { status: 'signed-out', configured: s.configured }))
      .catch((err: Error) => setAuth({ status: 'signed-out', configured: true, serverError: err.message }));
  }, []);
  useEffect(() => { if (!SAMPLE_MODE) check(); }, [check]);
  const signedOut = useCallback(() => setAuth({ status: 'signed-out', configured: true }), []);

  if (auth.status === 'checking') return <Loading>Loading Design OS…</Loading>;
  if (auth.status === 'signed-out') return <Login configured={auth.configured} serverError={auth.serverError} onSignedIn={() => setAuth({ status: 'signed-in' })} />;
  return <AppProvider onSignedOut={signedOut}><Shell /></AppProvider>;
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
