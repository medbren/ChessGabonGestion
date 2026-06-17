'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  // Message affiché en cas d'erreur de connexion.
  const [message, setMessage] = useState('');

  // Fonction appelée lorsque l'administrateur soumet le formulaire.
  async function login(event: any) {
    event.preventDefault();

    const form = event.target;

    // Envoi de l'email et du mot de passe à l'API NestJS.
    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email.value,
        password: form.password.value,
      }),
    });

    // Si les identifiants sont incorrects, on affiche un message.
    if (!res.ok) {
      setMessage('Email ou mot de passe incorrect');
      return;
    }

    const data = await res.json();

    // Stockage du token JWT dans le navigateur.
    // Ce token sera utilisé ensuite pour accéder aux routes protégées.
    localStorage.setItem('token', data.accessToken);

    // Stockage des informations de l'utilisateur connecté.
    localStorage.setItem('user', JSON.stringify(data.user));

    // Redirection vers l'administration.
    router.push('/admin');
  }

  return (
    <main style={{ maxWidth: '500px', margin: '80px auto' }}>
      <h1>Connexion administrateur</h1>

      <form onSubmit={login}>
        <p>
          <input
            name="email"
            type="email"
            placeholder="Email"
            required
          />
        </p>

        <p>
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
          />
        </p>

        <button type="submit">
          Se connecter
        </button>
      </form>

      <p>{message}</p>
    </main>
  );
}