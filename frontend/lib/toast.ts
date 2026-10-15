export type ToastType = 'success' | 'error' | 'info';

export interface ToastPayload {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

type Listener = (toast: ToastPayload) => void;

const listeners = new Set<Listener>();

export function subscribeToast(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(toast: ToastPayload) {
  listeners.forEach((l) => l(toast));
}

function show(type: ToastType, message: string, duration = 4000) {
  emit({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    message,
    duration,
  });
}

export const toast = {
  success: (message: string, duration?: number) =>
    show('success', message, duration),
  error: (message: string, duration?: number) =>
    show('error', message, duration),
  info: (message: string, duration?: number) =>
    show('info', message, duration),
};
