'use client';

import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  subscribeToast,
  type ToastPayload,
  type ToastType,
} from '@/lib/toast';

const styles: Record<ToastType, string> = {
  success: 'border-brand/30 bg-white text-brand-dark shadow-brand/10',
  error: 'border-red-200 bg-white text-red-700 shadow-red-100',
  info: 'border-blue-200 bg-white text-blue-700 shadow-blue-100',
};

const accent: Record<ToastType, string> = {
  success: 'bg-brand',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

const icons = {
  success: Check,
  error: AlertCircle,
  info: Info,
} as const;

function ToastItem({
  toast,
  onClose,
}: {
  toast: ToastPayload;
  onClose: (id: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const Icon = icons[toast.type];

  const dismiss = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onClose(toast.id), 200);
  }, [onClose, toast.id]);

  useEffect(() => {
    const enter = requestAnimationFrame(() => setVisible(true));
    const duration = toast.duration ?? 4000;
    const timer = window.setTimeout(dismiss, duration);
    return () => {
      cancelAnimationFrame(enter);
      window.clearTimeout(timer);
    };
  }, [dismiss, toast.duration]);

  return (
    <div
      role={toast.type === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-xl border bg-white px-4 py-3 text-sm shadow-lg transition-all duration-200',
        styles[toast.type],
        visible && !leaving
          ? 'translate-y-0 opacity-100'
          : 'translate-y-2 opacity-0',
        leaving && 'translate-y-1 opacity-0'
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white',
          accent[toast.type]
        )}
        aria-hidden
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <p className="flex-1 pt-0.5 leading-snug text-gray-800">{toast.message}</p>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
      <span
        className={cn(
          'absolute bottom-0 left-0 h-0.5 origin-left',
          accent[toast.type]
        )}
        style={{
          animation: `toast-progress ${toast.duration ?? 4000}ms linear forwards`,
        }}
      />
    </div>
  );
}

export function ToastContainer() {
  const [items, setItems] = useState<ToastPayload[]>([]);

  useEffect(() => {
    return subscribeToast((toast) => {
      setItems((prev) => [...prev.slice(-4), toast]);
    });
  }, []);

  function remove(id: string) {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:right-6 sm:w-auto sm:p-0"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((t) => (
        <ToastItem key={t.id} toast={t} onClose={remove} />
      ))}
    </div>
  );
}
