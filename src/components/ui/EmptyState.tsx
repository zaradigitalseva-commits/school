import { type ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
        {icon ?? <Inbox className="w-8 h-8 text-gray-400" />}
      </div>
      <h3 className="text-base font-semibold text-gray-700">{title}</h3>
      {message && <p className="text-sm text-gray-400 mt-1">{message}</p>}
    </div>
  );
}
