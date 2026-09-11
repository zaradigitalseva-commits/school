import { useEffect, useState } from 'react';
import { CalendarDays, MapPin } from 'lucide-react';
import { fetchEvents, formatDate } from '@/firebase/firestore';
import type { SchoolEvent } from '@/firebase/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';

export default function EventsPage() {
  const { info } = useSchoolInfo();
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents()
      .then(setEvents)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Loading events..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.campusImages?.[1] ?? info.heroImageUrl} alt="Events" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">School Events</h1>
          <p className="text-blue-100 max-w-xl mx-auto">Join us at our upcoming events and activities.</p>
        </div>
      </section>

      {/* Events */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {events.length === 0 ? (
            <EmptyState
              icon={<CalendarDays className="w-8 h-8 text-gray-400" />}
              title="No events scheduled"
              message="Check back soon for upcoming events and activities."
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                  {e.imageUrl && (
                    <img src={e.imageUrl} alt={e.title} className="w-full h-44 object-cover" />
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-2">{e.title}</h3>
                    <p className="text-sm text-gray-500 mb-4 line-clamp-3">{e.description}</p>
                    <div className="space-y-1.5 text-xs text-gray-400">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-500" />
                        {formatDate(e.date)}
                      </div>
                      {e.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {e.location}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
