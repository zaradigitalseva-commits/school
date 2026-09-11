import LoadingSpinner from './LoadingSpinner';

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size={40} label="Loading..." />
    </div>
  );
}
