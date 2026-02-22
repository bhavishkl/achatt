"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

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

  return (
    <main className="min-h-screen bg-neutral-950 flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-neutral-900 rounded-lg shadow-lg">
        <div>
          <h1 className="text-2xl font-bold text-white text-center">
            {isSigningUp ? 'Create an Account' : 'Sign in to your Account'}
          </h1>
          <p className="mt-2 text-center text-sm text-neutral-400">
            {isSigningUp ? (
              <>
                Already have an account?{' '}
                <button onClick={() => setIsSigningUp(false)} className="font-medium text-blue-500 hover:text-blue-400">
                  Sign In
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{' '}
                <button onClick={() => setIsSigningUp(true)} className="font-medium text-blue-500 hover:text-blue-400">
                  Sign Up
                </button>
              </>
            )}
          </p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email-address" className="sr-only">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-neutral-700 bg-neutral-800 text-white placeholder-neutral-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {!isSigningUp && (
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-300">
                Remember me
              </label>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSigningUp ? 'Sign Up' : 'Sign In'}
            </button>
          </div>
        </form>
        {message && <p className="text-center text-sm text-neutral-400">{message}</p>}
      </div>
    </main>
  );
}
