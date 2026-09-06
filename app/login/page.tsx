'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/lib/client-auth';
import { api, errorText } from '@/lib/api';
import { Brand } from '@/components/Brand';
import { Button, Fieldset, Input, Notice, Spinner } from '@/components/ui';
import { AuthAside } from '@/components/AuthAside';
import { PublicOnlyRoute } from '@/components/AuthGuard';

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(email, password);
      router.replace(from);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleLogin() {
    // Convenient instant sign-in with the primary seeded account
    setEmail('aarav.sharma@example.com');
    setPassword('Pass@123');
    setBusy(true);
    try {
      await login('aarav.sharma@example.com', 'Pass@123');
      router.replace(from);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendReset() {
    setForgot('');
    if (!email) {
      setError('Enter your email address first, then click "Forgot password".');
      return;
    }
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setForgot(data.message);
      setError('');
    } catch (err) {
      setError(errorText(err));
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_minmax(440px,46%)]">
      <AuthAside />

      <div className="flex items-center justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="rise w-full max-w-[390px] space-y-6">
          <div className="lg:hidden mb-6">
            <Brand />
          </div>

          <div>
            <span className="eyebrow text-brand">Welcome Back</span>
            <h1 className="mt-1 text-[28px] sm:text-[32px] font-black tracking-tight text-ink">
              Sign in to your account
            </h1>
            <p className="mt-1 text-[14px] text-slate">
              Pick up planning right where you left off.
            </p>
          </div>

          {/* Social Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-rule bg-surface px-4 py-2.5 text-[14px] font-semibold text-ink shadow-xs hover:bg-canvas transition-colors cursor-pointer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <div className="relative flex items-center justify-center">
            <span className="h-px w-full bg-rule" />
            <span className="absolute bg-surface px-3 text-[12px] uppercase font-semibold text-mist">
              or with email
            </span>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Fieldset label="Email address">
              <Input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="aarav.sharma@example.com"
              />
            </Fieldset>

            <Fieldset label="Password">
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </Fieldset>

            <div className="flex items-center justify-between text-[13px]">
              <button
                type="button"
                onClick={sendReset}
                className="text-brand font-medium hover:underline cursor-pointer"
              >
                Forgot password?
              </button>
            </div>

            {error && <Notice>{error}</Notice>}
            {forgot && <Notice tone="sea">{forgot}</Notice>}

            <Button variant="primary" type="submit" busy={busy} className="w-full h-11 text-[15px]">
              <span>Sign In</span>
              <ArrowRight size={15} />
            </Button>
          </form>

          <div className="border-t border-rule pt-4 text-center text-[13.5px] text-slate">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-bold text-brand hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <PublicOnlyRoute>
      <Suspense fallback={<div className="grid min-h-screen place-items-center"><Spinner /></div>}>
        <LoginForm />
      </Suspense>
    </PublicOnlyRoute>
  );
}
