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

const icons: Record<AlertType, string> = {
  success: '\u2713',
  error: '\u26a0',
  info: '\u2139',
};

export function Alert({ type, message, className }: AlertProps) {
  if (!message) return null;
  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-sm', styles[type], className)}
    >
      <span className="mt-0.5 shrink-0">{icons[type]}</span>
      <span>{message}</span>
    </div>
  );
}
