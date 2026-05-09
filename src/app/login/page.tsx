"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SavedAccount {
  email: string;
  userId?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [message, setMessage] = useState('');
  
  const [savedAccounts, setSavedAccounts] = useState<SavedAccount[]>([]);
  const [showSavedAccounts, setShowSavedAccounts] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const init = () => {
      const saved = localStorage.getItem('savedAccounts');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSavedAccounts(parsed);
            setShowSavedAccounts(true);
          }
        } catch (e) {
          console.error("Could not parse saved accounts", e);
        }
      }
    };
    init();
  }, []);

  const saveAccountLocally = (userEmail: string, userId: string | null) => {
    const saved = localStorage.getItem('savedAccounts');
    let accounts: SavedAccount[] = [];
    if (saved) {
      try {
        accounts = JSON.parse(saved);
      } catch (e) {}
    }
    accounts = accounts.filter(acc => acc.email !== userEmail);
    accounts.unshift({ email: userEmail, userId: userId || undefined });
    
    localStorage.setItem('savedAccounts', JSON.stringify(accounts));
    setSavedAccounts(accounts);
  };

  const removeSavedAccount = (userEmail: string) => {
    const updated = savedAccounts.filter(acc => acc.email !== userEmail);
    setSavedAccounts(updated);
    localStorage.setItem('savedAccounts', JSON.stringify(updated));
    if (updated.length === 0) {
      setShowSavedAccounts(false);
    }
  };

  const handleQuickLogin = (account: SavedAccount) => {
    setMessage(`Logging into ${account.email}...`);
    const activeStorage = localStorage;
    activeStorage.setItem('isAuthenticated', 'true');
    activeStorage.setItem('userEmail', account.email);
    if (account.userId) {
      activeStorage.setItem('userId', account.userId);
    } else {
      activeStorage.removeItem('userId');
    }
    router.push('/');
  };

  const handleSignUp = async () => {
    setMessage('Signing up...');
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage('Signup successful! Please sign in.');
      setIsSigningUp(false);
    } else {
      setMessage(data.message || `Signup failed: ${data.error || 'Unknown error'}`);
    }
  };

  const handleSignIn = async () => {
    setMessage('Signing in...');
    const response = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (response.ok) {
      setMessage('Sign in successful!');
      const activeStorage = rememberMe ? localStorage : sessionStorage;
      const inactiveStorage = rememberMe ? sessionStorage : localStorage;

      inactiveStorage.removeItem('isAuthenticated');
      inactiveStorage.removeItem('userEmail');
      inactiveStorage.removeItem('userId');

      activeStorage.setItem('isAuthenticated', 'true');
      activeStorage.setItem('userEmail', email);
      if (data.userId) {
        activeStorage.setItem('userId', data.userId);
      } else {
        activeStorage.removeItem('userId');
      }

      saveAccountLocally(email, data.userId || null);

      router.push('/');
    } else {
      setMessage(data.message || `Sign in failed: ${data.error || 'Unknown error'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSigningUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  if (showSavedAccounts) {
    return (
      <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-8 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800">
          <div>
            <h1 className="text-3xl font-bold text-white text-center tracking-tight">
              Achatt
            </h1>
            <p className="mt-2 text-center text-sm text-neutral-400">
              Recent Logins
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {savedAccounts.map(acc => (
              <div key={acc.email} className="relative flex flex-col items-center p-5 bg-neutral-800/50 hover:bg-neutral-800 border border-neutral-700/50 hover:border-neutral-600 rounded-xl transition cursor-pointer group" onClick={() => handleQuickLogin(acc)}>
                <button 
                  onClick={(e) => { e.stopPropagation(); removeSavedAccount(acc.email); }}
                  className="absolute top-2 right-2 text-neutral-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove account"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-blue-400 flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg">
                  {acc.email.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm font-medium text-white truncate w-full text-center">
                  {acc.email}
                </div>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-neutral-800">
            <button
              onClick={() => {
                setShowSavedAccounts(false);
                setEmail('');
                setPassword('');
              }}
              className="w-full flex justify-center py-2.5 px-4 text-sm font-medium rounded-lg text-blue-400 bg-transparent hover:bg-blue-500/10 focus:outline-none transition"
            >
              Log in to another account
            </button>
          </div>
          {message && <p className="text-center text-sm text-neutral-400 mt-4">{message}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-neutral-900 rounded-xl shadow-2xl border border-neutral-800">
        <div>
          <h1 className="text-3xl font-bold text-white text-center tracking-tight">
            Achatt
          </h1>
          <h2 className="mt-6 text-xl font-semibold text-white text-center">
            {isSigningUp ? 'Create an Account' : 'Sign in to your Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-neutral-400">
            {isSigningUp ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsSigningUp(false)} className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => setIsSigningUp(true)} className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-neutral-300 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none block w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-300 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none block w-full px-4 py-3 rounded-lg border border-neutral-700 bg-neutral-800/50 text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all sm:text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isSigningUp && (
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-300 cursor-pointer">
                  Remember me
                </label>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-900 focus:ring-blue-500 transition-colors shadow-lg"
            >
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
        {savedAccounts.length > 0 && !isSigningUp && (
          <div className="pt-4 border-t border-neutral-800 text-center">
            <button
              onClick={() => setShowSavedAccounts(true)}
              className="text-sm font-medium text-blue-400 hover:text-blue-300 transition-colors"
            >
              Show saved accounts
            </button>
          </div>
        )}
        {message && <p className="text-center text-sm text-neutral-400 bg-neutral-800/50 py-2 rounded-lg">{message}</p>}
      </div>
    </main>
  );
}
