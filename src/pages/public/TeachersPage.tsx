import { useEffect, useState } from 'react';
import { Mail, Phone, BookOpen, GraduationCap } from 'lucide-react';
import { fetchTeachers } from '@/firebase/firestore';
import type { Teacher } from '@/firebase/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';

export default function TeachersPage() {
  const { info } = useSchoolInfo();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeachers()
      .then(setTeachers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Loading teachers..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.campusImages?.[0] ?? info.heroImageUrl} alt="Teachers" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Our Teachers</h1>
          <p className="text-blue-100 max-w-xl mx-auto">Meet the dedicated educators who inspire our students every day.</p>
        </div>
      </section>

      {/* Teachers grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {teachers.length === 0 ? (
            <EmptyState
              icon={<GraduationCap className="w-8 h-8 text-gray-400" />}
              title="No teachers listed yet"
              message="Teacher profiles will appear here once they are added."
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {teachers.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={t.imageUrl || 'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                      alt={t.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-3 left-4 right-4">
                      <h3 className="text-lg font-bold text-white">{t.name}</h3>
                      <p className="text-sm text-blue-200">{t.designation}</p>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium">
                        <BookOpen className="w-3 h-3" /> {t.subject}
                      </span>
                      <span className="text-xs text-gray-400">{t.qualification}</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{t.bio}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {t.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" /> {t.email}
                        </span>
                      )}
                      {t.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {t.phone}
                        </span>
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
