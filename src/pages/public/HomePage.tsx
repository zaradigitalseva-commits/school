import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  BookOpen,
  Trophy,
  Users,
  ArrowRight,
  CalendarDays,
  Megaphone,
  Award,
  Heart,
  Lightbulb,
  ShieldCheck,
} from 'lucide-react';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import { fetchAnnouncements, fetchEvents, fetchTeachers, formatDate } from '@/firebase/firestore';
import type { Announcement, SchoolEvent, Teacher } from '@/firebase/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const { info, loading } = useSchoolInfo();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    fetchAnnouncements().then((d) => setAnnouncements(d.slice(0, 3))).catch(() => {});
    fetchEvents().then((d) => setEvents(d.slice(0, 3))).catch(() => {});
    fetchTeachers().then((d) => setTeachers(d.slice(0, 4))).catch(() => {});
  }, []);

  if (loading) return <LoadingSpinner fullScreen label="Loading..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={info.heroImageUrl}
            alt="School campus"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/70 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-6 animate-fade-in-up">
            <GraduationCap className="w-4 h-4 text-blue-300" />
            <span className="text-sm text-white font-medium">Welcome to {info.name}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight animate-fade-in-up">
            {info.tagline}
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8 animate-fade-in-up">
            {info.description.slice(0, 150)}...
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in-up">
            <Link
              to="/about"
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-semibold btn-3d hover:bg-blue-50 inline-flex items-center justify-center gap-2"
            >
              Learn More <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 inline-flex items-center justify-center gap-2 border border-white/20"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, label: 'Students', value: info.totalStudents, color: 'blue' },
              { icon: GraduationCap, label: 'Teachers', value: info.totalTeachers, color: 'emerald' },
              { icon: BookOpen, label: 'Courses', value: info.totalCourses, color: 'amber' },
              { icon: Award, label: 'Founded', value: info.foundedYear, color: 'rose' },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-6 card-shadow card-shadow-hover text-center"
              >
                <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center bg-${stat.color}-50`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">About Our School</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-4">
                A Legacy of Excellence in Education
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">{info.description}</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                {[
                  { icon: Heart, title: 'Caring Environment', desc: 'Supportive community' },
                  { icon: Lightbulb, title: 'Innovative Learning', desc: 'Modern teaching methods' },
                  { icon: ShieldCheck, title: 'Safe Campus', desc: 'Secure & welcoming' },
                  { icon: Trophy, title: 'Award Winning', desc: 'Recognized excellence' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-500">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                to="/about"
                className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
              >
                Read more about us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {info.campusImages?.slice(0, 4).map((img, i) => (
                <img
                  key={i}
                  src={img}
                  alt={`Campus ${i + 1}`}
                  className={`rounded-2xl object-cover card-shadow ${i % 2 === 0 ? 'mt-8' : ''}`}
                  style={{ height: i % 2 === 0 ? '220px' : '260px' }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Principal message */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-3xl p-8 sm:p-12 card-shadow">
            <div className="grid sm:grid-cols-3 gap-8 items-center">
              <div className="sm:col-span-1">
                <img
                  src={info.principalImageUrl}
                  alt={info.principalName}
                  className="w-48 h-48 rounded-2xl object-cover card-shadow mx-auto"
                />
              </div>
              <div className="sm:col-span-2">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Principal's Message</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3">{info.principalName}</h2>
                <p className="text-gray-600 leading-relaxed italic">"{info.principalMessage}"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Announcements */}
      {announcements.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4" /> Latest News
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">Announcements</h2>
              </div>
              <Link to="/notices" className="text-blue-600 font-semibold hover:underline hidden sm:block">
                View all
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {announcements.map((a) => (
                <div key={a.id} className="bg-white rounded-2xl p-6 card-shadow card-shadow-hover">
                  <div className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold mb-3 ${
                    a.priority === 'high' ? 'bg-red-50 text-red-600' :
                    a.priority === 'medium' ? 'bg-amber-50 text-amber-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {a.priority} priority
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{a.title}</h3>
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{a.content}</p>
                  <p className="text-xs text-gray-400">{formatDate(a.date)}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Events */}
      {events.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4" /> What's Happening
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">Upcoming Events</h2>
              </div>
              <Link to="/events" className="text-blue-600 font-semibold hover:underline hidden sm:block">
                View all
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {events.map((e) => (
                <div key={e.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover">
                  {e.imageUrl && (
                    <img src={e.imageUrl} alt={e.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 mb-1">{e.title}</h3>
                    <p className="text-sm text-gray-500 mb-3 line-clamp-2">{e.description}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <CalendarDays className="w-3.5 h-3.5" /> {formatDate(e.date)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Teachers preview */}
      {teachers.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-4 h-4" /> Our Team
                </span>
                <h2 className="text-3xl font-bold text-gray-900 mt-2">Meet Our Teachers</h2>
              </div>
              <Link to="/teachers" className="text-blue-600 font-semibold hover:underline hidden sm:block">
                View all
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {teachers.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl overflow-hidden card-shadow card-shadow-hover text-center">
                  <img
                    src={t.imageUrl || 'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'}
                    alt={t.name}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-sm">{t.name}</h3>
                    <p className="text-xs text-blue-600 font-medium">{t.designation}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.subject}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-blue-700 to-blue-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Join Our Community?
          </h2>
          <p className="text-blue-100 mb-8 max-w-xl mx-auto">
            Discover what makes {info.name} the perfect place for your child's education.
          </p>
          <Link
            to="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-700 font-semibold btn-3d hover:bg-blue-50"
          >
            Get in Touch <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
