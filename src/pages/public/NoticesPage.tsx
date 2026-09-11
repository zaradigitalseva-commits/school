import { useEffect, useState } from 'react';
import { Megaphone, CalendarDays } from 'lucide-react';
import { fetchAnnouncements, formatDate } from '@/firebase/firestore';
import type { Announcement } from '@/firebase/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';

export default function NoticesPage() {
  const { info } = useSchoolInfo();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Loading announcements..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.campusImages?.[2] ?? info.heroImageUrl} alt="Notices" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Notices & Announcements</h1>
          <p className="text-blue-100 max-w-xl mx-auto">Stay updated with the latest news and information.</p>
        </div>
      </section>

      {/* Announcements list */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {announcements.length === 0 ? (
            <EmptyState
              icon={<Megaphone className="w-8 h-8 text-gray-400" />}
              title="No announcements yet"
              message="Check back soon for the latest news and updates."
            />
          ) : (
            <div className="space-y-4">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-6 card-shadow card-shadow-hover">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-start gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        a.priority === 'high' ? 'bg-red-50' :
                        a.priority === 'medium' ? 'bg-amber-50' : 'bg-blue-50'
                      }`}>
                        <Megaphone className={`w-5 h-5 ${
                          a.priority === 'high' ? 'text-red-600' :
                          a.priority === 'medium' ? 'text-amber-600' : 'text-blue-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{a.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                            a.priority === 'high' ? 'bg-red-50 text-red-600' :
                            a.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                            'bg-blue-50 text-blue-600'
                          }`}>
                            {a.priority} priority
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <CalendarDays className="w-3 h-3" /> {formatDate(a.date)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 leading-relaxed text-sm mt-3">{a.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
