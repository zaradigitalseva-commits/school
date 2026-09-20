import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  subscribeToSchoolBySlug,
  subscribeToSchoolPublicCollection,
  subscribeToPublicResults,
} from '@/firebase/firestore';

import type {
  School,
  Announcement,
  SchoolEvent,
  Teacher,
} from '@/firebase/types';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import SchoolHeader from '@/components/school-public/SchoolHeader';
import HeroSection from '@/components/school-public/HeroSection';
import StatsSection from '@/components/school-public/StatsSection';
import AboutSection from '@/components/school-public/AboutSection';
import PrincipalSection from '@/components/school-public/PrincipalSection';
import AnnouncementsSection from '@/components/school-public/AnnouncementsSection';
import EventsSection from '@/components/school-public/EventsSection';
import ResultsSection from '@/components/school-public/ResultsSection';
import TeachersSection from '@/components/school-public/TeachersSection';
import GallerySection from '@/components/school-public/GallerySection';
import ContactSection from '@/components/school-public/ContactSection';
import CTASection from '@/components/school-public/CTASection';
import FooterSection from '@/components/school-public/FooterSection';

export default function SchoolPublicPage() {
  const { slug } = useParams<{ slug: string }>();

  const [school, setSchool] = useState<School | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [rollNumber, setRollNumber] = useState('');
  const [resultSearchLoading, setResultSearchLoading] = useState(false);
  const [publicResults, setPublicResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contentLoading, setContentLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchedRollNumber, setSearchedRollNumber] = useState('');

  useEffect(() => {
    if (!slug) {
      setError('School URL is missing.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setContentLoading(true);
    setError('');

    let schoolId = '';
    let unsubAnnouncements = () => {};
    let unsubEvents = () => {};
    let unsubTeachers = () => {};

    const unsubscribeSchool = subscribeToSchoolBySlug(
      slug,
      (schoolData) => {
        if (!schoolData) {
          setSchool(null);
          setError('School not found or school is not currently live.');
          setLoading(false);
          setContentLoading(false);
          unsubAnnouncements();
          unsubEvents();
          unsubTeachers();
          return;
        }

        schoolId = schoolData.id;
        setSchool(schoolData);
        setLoading(false);
        setContentLoading(false);

        unsubAnnouncements();
        unsubEvents();
        unsubTeachers();

        unsubAnnouncements = subscribeToSchoolPublicCollection(
          schoolId,
          'announcements',
          (rows) => setAnnouncements((rows as Announcement[]).slice(0, 3)),
          (err) => console.error('Live notices error:', err)
        );

        unsubEvents = subscribeToSchoolPublicCollection(
          schoolId,
          'events',
          (rows) => setEvents((rows as SchoolEvent[]).slice(0, 3)),
          (err) => console.error('Live events error:', err)
        );

        unsubTeachers = subscribeToSchoolPublicCollection(
          schoolId,
          'teachers',
          (rows) => setTeachers((rows as Teacher[]).slice(0, 4)),
          (err) => console.error('Live teachers error:', err)
        );
      },
      (err) => {
        console.error('Live school error:', err);
        setError(err.message || 'Unable to load school website.');
        setLoading(false);
        setContentLoading(false);
      }
    );

    return () => {
      unsubscribeSchool();
      unsubAnnouncements();
      unsubEvents();
      unsubTeachers();
    };
  }, [slug]);


  useEffect(() => {
    if (!school?.id || !searchedRollNumber.trim()) {
      setPublicResults([]);
      setResultSearchLoading(false);
      return;
    }

    setResultSearchLoading(true);

    const unsubscribe = subscribeToPublicResults(
      school.id,
      searchedRollNumber,
      (rows) => {
        setPublicResults(rows);
        setResultSearchLoading(false);
      },
      (err) => {
        console.error('Live public result lookup failed:', err);
        setPublicResults([]);
        setResultSearchLoading(false);
      }
    );

    return unsubscribe;
  }, [school?.id, searchedRollNumber]);
  if (loading) {
    return <LoadingSpinner fullScreen label="Loading school website..." />;
  }

  if (error || !school) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
          <div className="text-6xl">🏫</div>

          <h1 className="mt-4 text-2xl font-black text-gray-900">
            School Not Available
          </h1>

          <p className="mt-3 text-gray-600">
            {error || 'This school could not be found.'}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/schools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-7 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🔎 View Schools
            </Link>

            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 px-7 py-3 font-black text-white shadow-[0_5px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              <Home className="h-4 w-4" />
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const heroImage =
    school.heroImageUrl ||
    'https://images.pexels.com/photos/207692/pexels-photo-207692.jpeg?auto=compress&cs=tinysrgb&w=1600';


  function searchPublicResults() {
    const cleanRoll = rollNumber.trim();
    setSearchedRollNumber(cleanRoll);
  }

  const campusImages =
    (
      school as School & {
        campusImages?: string[];
      }
    ).campusImages || [];

  const totalStudents = school.totalStudents ?? 0;
  const totalTeachers = school.totalTeachers ?? 0;
  const foundedYear = school.foundedYear || '—';

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <SchoolHeader school={school} />
      <HeroSection school={school} heroImage={heroImage} />
      <StatsSection
        totalStudents={totalStudents}
        totalTeachers={totalTeachers}
        foundedYear={foundedYear}
      />
      <AboutSection school={school} campusImages={campusImages} heroImage={heroImage} />
      <PrincipalSection school={school} />
      <AnnouncementsSection announcements={announcements} contentLoading={contentLoading} />
      <EventsSection events={events} />
      <ResultsSection
        school={school}
        rollNumber={rollNumber}
        setRollNumber={setRollNumber}
        resultSearchLoading={resultSearchLoading}
        publicResults={publicResults}
        searchPublicResults={searchPublicResults}
      />
      <TeachersSection teachers={teachers} />
      <GallerySection school={school} campusImages={campusImages} />
      <ContactSection school={school} />
      <CTASection school={school} teachers={teachers} />
      <FooterSection school={school} />
    </div>
  );
}
}
