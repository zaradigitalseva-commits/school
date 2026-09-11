import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  label?: string;
  fullScreen?: boolean;
}

export default function LoadingSpinner({
  size = 32,
  label,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Loader2
        className="animate-spin text-blue-600"
        style={{ width: size, height: size }}
      />
      {label && <p className="text-sm text-gray-500 font-medium">{label}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {content}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{content}</div>;
}
