"use client";

import { useEffect, useState } from 'react';
import { Avatar } from '@/components/ui/Avatar';

/** Cache module — évite de re-fetch le même joueur. */
const avatarCache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

async function fetchChessComAvatar(username: string): Promise<string | null> {
  const key = username.trim().toLowerCase();
  if (!key) return null;
  if (avatarCache.has(key)) return avatarCache.get(key) ?? null;

  const existing = inflight.get(key);
  if (existing) return existing;

  const promise = (async () => {
    try {
      const res = await fetch(`https://api.chess.com/pub/player/${encodeURIComponent(key)}`, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        avatarCache.set(key, null);
        return null;
      }
      const data = (await res.json()) as { avatar?: string };
      const url = typeof data.avatar === 'string' && data.avatar.length > 0 ? data.avatar : null;
      avatarCache.set(key, url);
      return url;
    } catch {
      avatarCache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

interface ChessComAvatarProps {
  name: string;
  chesscom?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/** Avatar avec photo Chess.com si un pseudo chesscom est fourni. */
export function ChessComAvatar({
  name,
  chesscom,
  size = 'md',
  className,
}: ChessComAvatarProps) {
  const [src, setSrc] = useState<string | null>(() => {
    if (!chesscom) return null;
    return avatarCache.get(chesscom.trim().toLowerCase()) ?? null;
  });

  useEffect(() => {
    if (!chesscom?.trim()) {
      setSrc(null);
      return;
    }
    let cancelled = false;
    void fetchChessComAvatar(chesscom).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [chesscom]);

  return <Avatar name={name} src={src} size={size} className={className} />;
}
