'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Crown, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SiteHeader } from '@/components/SiteHeader';
import { Button } from '@/components/ui/Button';
import {
  BASE_URL,
  extractAccessToken,
  getToken,
  setSession,
} from '@/lib/api';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';

type Status = 'idle' | 'loading' | 'error';
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const GREEN  = '#009E60';
const GREEN_DARK = '#007A4A';

/* ─── Types ────────────────────────────────────────────────── */

interface LoginResponse {
  accessToken: string;
  user: unknown;
}

export default function LoginPage() {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const errorId = useId();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);

  useEffect(() => {
    if (getToken()) {
      router.replace('/admin');
      return;
    }
    emailRef.current?.focus();
  }, [router]);

  useEffect(() => {
    if (status === 'error' && errorMsg) {
      errorRef.current?.focus();
    }
  }, [status, errorMsg]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMsg(null);
    setStatus('loading');

    const email = emailRef.current?.value?.trim() ?? '';
    const password = passwordRef.current?.value ?? '';

    if (!email || !password) {
      setErrorMsg('Veuillez renseigner l’e-mail et le mot de passe.');
      setStatus('error');
      return;
    }

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.status === 401) {
        setErrorMsg('E-mail ou mot de passe incorrect.');
        setStatus('error');
        passwordRef.current?.select();
        return;
      }
      if (!res.ok) {
        setErrorMsg(`Erreur serveur (${res.status}). Réessayez plus tard.`);
        setStatus('error');
        return;
      }
      const data: unknown = await res.json();
      const token = extractAccessToken(data);
      if (!token) {
        setErrorMsg('Réponse serveur invalide (token manquant).');
        setStatus('error');
        return;
      }
      const user =
        data && typeof data === 'object' && 'user' in data
          ? (data as LoginResponse).user
          : data;
      setSession(token, user);
      toast.success('Connexion réussie');
      router.replace('/admin');
    } catch {
      setErrorMsg(
        'Impossible de contacter le serveur. Vérifiez votre connexion.'
      );
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';
  const hasError = status === 'error' && !!errorMsg;

  return (
    <div className="flex min-h-dvh flex-col bg-surface">
      <SiteHeader />

      <main
        className="flex flex-1 items-center justify-center px-4 py-8 sm:py-10"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
          paddingLeft: 'max(1rem, env(safe-area-inset-left))',
          paddingRight: 'max(1rem, env(safe-area-inset-right))',
        }}
      >
        <div className="animate-scale-in w-full max-w-md rounded-2xl border border-border bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 text-center">
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-light text-brand"
              aria-hidden
            >
              <Crown className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">
              Connexion administrateur
            </h1>
            <p className="mt-1 text-sm text-muted">
              Accès réservé aux membres du bureau
            </p>
          </div>

          {hasError && (
            <div
              ref={errorRef}
              id={errorId}
              role="alert"
              tabIndex={-1}
              className="mb-4 flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800 outline-none"
            >
              <AlertCircle
                className="mt-0.5 h-4 w-4 shrink-0 text-red-600"
                aria-hidden
              />
              <p>{errorMsg}</p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4"
            aria-describedby={hasError ? errorId : undefined}
          >
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-medium text-gray-600">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  id="email"
                  ref={emailRef}
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="admin@chessgabon.ga"
                  required
                  disabled={isLoading}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? errorId : undefined}
                  className={cn(
                    'w-full rounded-lg border bg-surface py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 disabled:opacity-60',
                    hasError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-border focus:border-brand focus:ring-brand/20'
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-medium text-gray-600">
                Mot de passe
              </label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                  aria-hidden
                />
                <input
                  id="password"
                  ref={passwordRef}
                  type={showPwd ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? errorId : undefined}
                  className={cn(
                    'w-full rounded-lg border bg-surface py-2.5 pl-10 pr-11 text-sm outline-none transition focus:ring-2 disabled:opacity-60',
                    hasError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                      : 'border-border focus:border-brand focus:ring-brand/20'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30"
                  aria-label={
                    showPwd
                      ? 'Masquer le mot de passe'
                      : 'Afficher le mot de passe'
                  }
                >
                  {showPwd ? (
                    <EyeOff className="h-4 w-4" aria-hidden />
                  ) : (
                    <Eye className="h-4 w-4" aria-hidden />
                  )}
                </button>
              </div>
            </div>

            <Button type="submit" loading={isLoading} className="w-full" size="lg">
              {isLoading ? 'Connexion…' : 'Se connecter'}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted">
            Mot de passe oublié ? Contactez un administrateur du club
            (pas de réinitialisation en libre-service).
          </p>

          <p className="mt-4 text-center">
            <Link href="/" className="text-sm text-muted transition hover:text-brand">
              Retour au classement
            </Link>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}