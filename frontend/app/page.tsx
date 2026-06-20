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

type Status = 'idle' | 'loading' | 'error';

/* ─── Component ─────────────────────────────────────────────── */

export default function LoginPage() {
  const router  = useRouter();
  const emailRef    = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const [status,  setStatus]  = useState<Status>('idle');
  const [message, setMessage] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email:    emailRef.current?.value,
          password: passwordRef.current?.value,
        }),
      });

      if (res.status === 401) {
        setMessage('Email ou mot de passe incorrect.');
        setStatus('error');
        return;
      }

      if (!res.ok) {
        setMessage(`Erreur serveur (${res.status}). Réessayez plus tard.`);
        setStatus('error');
        return;
      }

      const data = (await res.json()) as LoginResponse;
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push('/admin');
    } catch {
      setMessage('Impossible de contacter le serveur. Vérifiez votre connexion.');
      setStatus('error');
    }
  }

  const isLoading = status === 'loading';

  return (
    <main style={styles.page}>
      {/* ── Card ── */}
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>♟</div>
          <span style={styles.logoText}>
            <span style={{ color: GREEN }}>Chess</span>Gabon
            <span style={styles.logoMuted}>Gestion</span>
          </span>
        </div>

        <h1 style={styles.heading}>Connexion administrateur</h1>
        <p style={styles.hint}>Accès réservé aux membres du bureau.</p>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate style={styles.form}>

          {/* Email */}
          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>Adresse e-mail</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} aria-hidden="true">✉</span>
              <input
                id="email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                placeholder="admin@chessgabon.ga"
                required
                disabled={isLoading}
                style={styles.input}
              />
            </div>
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon} aria-hidden="true">🔒</span>
              <input
                id="password"
                ref={passwordRef}
                type={showPwd ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                style={{ ...styles.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={styles.eyeBtn}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {/* Error message */}
          {status === 'error' && (
            <div role="alert" style={styles.errorBox}>
              ⚠ {message}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            style={{ ...styles.submitBtn, ...(isLoading ? styles.submitBtnDisabled : {}) }}
          >
            {isLoading
              ? <><span style={styles.spinner} aria-hidden="true" /> Connexion…</>
              : 'Se connecter'}
          </button>
        </form>

        {/* Footer */}
        <p style={styles.footer}>
          <a href="/" style={styles.backLink}>← Retour au classement</a>
        </p>
      </div>
    </main>
  );
}

/* ─── Styles ─────────────────────────────────────────────────── */

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#F7F9FC',
    padding: '24px 16px',
  },

  card: {
    width: '100%',
    maxWidth: 420,
    background: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E8EBF0',
    padding: '2.5rem 2rem',
  },

  /* logo */
  logoWrap: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: '1.5rem',
  },
  logoIcon: {
    width: 38,
    height: 38,
    background: GREEN,
    borderRadius: 9,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: 500,
    letterSpacing: '-0.3px',
    color: '#1a1a1a',
  },
  logoMuted: {
    color: '#888',
    fontWeight: 400,
  },

  /* headings */
  heading: {
    fontSize: 20,
    fontWeight: 500,
    color: '#1a1a1a',
    textAlign: 'center',
    margin: '0 0 6px',
  },
  hint: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    margin: '0 0 1.75rem',
  },

  /* form */
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: '#444',
  },
  inputWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    fontSize: 14,
    pointerEvents: 'none',
    color: '#aaa',
  },
  input: {
    width: '100%',
    padding: '10px 12px 10px 36px',
    fontSize: 14,
    fontFamily: 'Inter, Arial, sans-serif',
    color: '#1a1a1a',
    background: '#F7F9FC',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#E0E4EC',
    borderRadius: 8,
    outline: 'none',
  },
  eyeBtn: {
    position: 'absolute',
    right: 10,
    background: 'none',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    cursor: 'pointer',
    fontSize: 15,
    padding: 4,
    color: '#aaa',
    lineHeight: 1,
  },

  /* error */
  errorBox: {
    fontSize: 13,
    color: '#a32d2d',
    background: '#FCEBEB',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#f7c1c1',
    borderRadius: 8,
    padding: '10px 14px',
  },

  /* submit */
  submitBtn: {
    marginTop: 4,
    padding: '11px',
    background: GREEN,
    color: '#fff',
    borderWidth: 0,
    borderStyle: 'solid',
    borderColor: 'transparent',
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 500,
    fontFamily: 'Inter, Arial, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background 0.15s',
  },
  submitBtnDisabled: {
    background: GREEN_DARK,
    cursor: 'not-allowed',
    opacity: 0.75,
  },
  spinner: {
    display: 'inline-block',
    width: 15,
    height: 15,
    borderRadius: '50%',
    borderWidth: 2,
    borderStyle: 'solid',
    borderColor: 'rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
    animation: 'spin 0.6s linear infinite',
  },

  /* footer */
  footer: {
    textAlign: 'center',
    marginTop: '1.5rem',
  },
  backLink: {
    fontSize: 13,
    color: '#888',
    textDecoration: 'none',
  },
};
