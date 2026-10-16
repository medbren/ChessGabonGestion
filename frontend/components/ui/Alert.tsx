import { AlertTriangle, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type AlertType = 'success' | 'error' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  className?: string;
}

const styles: Record<AlertType, string> = {
  success: 'bg-brand-light border-green-200 text-brand-dark',
  error: 'bg-red-50 border-red-200 text-red-700',
  info: 'bg-blue-50 border-blue-200 text-blue-700',
};

const icons = {
  success: Check,
  error: AlertTriangle,
  info: Info,
} as const;

export function Alert({ type, message, className }: AlertProps) {
  if (!message) return null;
  const Icon = icons[type];
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm',
        styles[type],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}
