import { Bell, CalendarDays, GraduationCap, Image, School, Users, ShieldCheck } from 'lucide-react';

const features = [
  { icon: School, title: 'School profiles', text: 'Participating schools can publish their name, description, contact details and public profile.' },
  { icon: Bell, title: 'Notices and announcements', text: 'School teams can share updates and important notices with visitors.' },
  { icon: CalendarDays, title: 'Events', text: 'Public event information can help families learn about school activities.' },
  { icon: Users, title: 'Staff information', text: 'Authorised school users can maintain teacher and staff information for their school.' },
  { icon: Image, title: 'Gallery and school updates', text: 'Schools can share suitable images and updates through the public school page.' },
  { icon: ShieldCheck, title: 'Account-based management', text: 'Different account roles provide access to the platform areas needed for school administration.' },
];

export default function AcademicsPage() {
  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-900 px-4 py-20 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-200">Platform Features</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Tools for School Communities</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-blue-100">Explore the public information and school-management features available through SchoolConnect.</p>
      </section>
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl border border-gray-100 bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><Icon className="h-6 w-6 text-blue-700" /></div>
              <h2 className="mt-5 text-xl font-extrabold text-gray-900">{title}</h2>
              <p className="mt-3 leading-7 text-gray-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="bg-white px-4 py-14 text-center">
        <GraduationCap className="mx-auto h-10 w-10 text-blue-700" />
        <h2 className="mt-4 text-2xl font-black text-gray-900">Looking for a school?</h2>
        <p className="mx-auto mt-3 max-w-xl leading-7 text-gray-600">Browse the participating schools directory and open a school's public page for its latest available information.</p>
        <a href="/schools" className="mt-6 inline-flex rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800">Browse Schools</a>
      </section>
    </div>
  );
}
