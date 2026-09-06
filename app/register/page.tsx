'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/client-auth';
import { errorText } from '@/lib/api';
import { Brand } from '@/components/Brand';
import { AuthAside } from '@/components/AuthAside';
import { Button, Fieldset, Input, Notice } from '@/components/ui';
import { PublicOnlyRoute } from '@/components/AuthGuard';

const BLANK = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  city: '',
  country: '',
  bio: '',
  photoUrl: '',
};

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(BLANK);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof BLANK) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: event.target.value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError('');

    if (form.password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setBusy(true);
    try {
      await register(form);
      router.replace('/dashboard');
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_minmax(460px,48%)]">
      <AuthAside />

      <div className="flex items-center justify-center bg-surface px-6 py-12 sm:px-12">
        <div className="rise w-full max-w-[420px] space-y-6">
          <div className="lg:hidden mb-6">
            <Brand />
          </div>

          <div>
            <span className="eyebrow text-brand">Start Your Journey</span>
            <h1 className="mt-1 text-[28px] sm:text-[32px] font-black tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-1 text-[14px] text-slate">
              Join thousands of explorers planning with GlobeTrotter.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Fieldset label="First name">
                <Input
                  required
                  value={form.firstName}
                  onChange={set('firstName')}
                  placeholder="Alex"
                  autoComplete="given-name"
                />
              </Fieldset>
              <Fieldset label="Last name">
                <Input
                  required
                  value={form.lastName}
                  onChange={set('lastName')}
                  placeholder="Rivera"
                  autoComplete="family-name"
                />
              </Fieldset>
            </div>

            <Fieldset label="Email address">
              <Input
                required
                type="email"
                value={form.email}
                onChange={set('email')}
                placeholder="alex.rivera@example.com"
                autoComplete="email"
              />
            </Fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Fieldset label="Password" hint="8+ chars">
                <Input
                  required
                  type="password"
                  minLength={8}
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Fieldset>

              <Fieldset label="Confirm password">
                <Input
                  required
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </Fieldset>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Fieldset label="Home City" hint="optional">
                <Input
                  value={form.city}
                  onChange={set('city')}
                  placeholder="San Francisco"
                />
              </Fieldset>
              <Fieldset label="Country" hint="optional">
                <Input
                  value={form.country}
                  onChange={set('country')}
                  placeholder="United States"
                />
              </Fieldset>
            </div>

            {error && <Notice>{error}</Notice>}

            <Button
              type="submit"
              variant="primary"
              busy={busy}
              className="w-full h-11 text-[15px] mt-2"
            >
              <span>Create Account</span>
              <ArrowRight size={15} />
            </Button>
          </form>

          <div className="border-t border-rule pt-4 text-center text-[13.5px] text-slate">
            Already have an account?{' '}
            <Link href="/login" className="font-bold text-brand hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <PublicOnlyRoute>
      <RegisterForm />
    </PublicOnlyRoute>
  );
}
