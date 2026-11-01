import { Target, Eye, ShieldCheck, School, Users, BookOpen } from 'lucide-react';

const principles = [
  { icon: School, title: 'School-owned public information', text: 'Participating schools can publish their own profile, contact information, announcements and events for families and visitors.' },
  { icon: Users, title: 'Role-based access', text: 'Platform access is organised around authorised roles such as platform administrators, school administrators and teachers.' },
  { icon: ShieldCheck, title: 'Responsible information handling', text: 'School administrators are responsible for the accuracy of the content they publish and for obtaining permissions required to share personal information.' },
];

export default function AboutPage() {
  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-900 px-4 py-20 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-200">About the Platform</p>
        <h1 className="mx-auto mt-3 max-w-4xl text-4xl font-black sm:text-5xl">About SchoolConnect</h1>
        <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-blue-100">One place to discover participating schools and access the information they choose to share.</p>
      </section>
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-black text-gray-900">What is SchoolConnect?</h2>
          <p className="mt-5 text-lg leading-8 text-gray-600">SchoolConnect is a multi-school website and management platform. Visitors can browse participating school profiles and view school-published information. Authorised school users can use available tools to manage selected school details and activities.</p>
          <p className="mt-4 leading-7 text-gray-600">Each participating school is responsible for the accuracy and timely updating of its own public information. SchoolConnect provides the platform through which that information is displayed; it does not replace direct communication with a school for admissions, fees, schedules or other school-specific decisions.</p>
        </div>
      </section>
      <section className="bg-gray-50 px-4 py-16">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
          {principles.map(({ icon: Icon, title, text }) => (
            <article key={title} className="rounded-2xl bg-white p-7 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50"><Icon className="h-6 w-6 text-blue-700" /></div>
              <h3 className="mt-5 text-xl font-extrabold text-gray-900">{title}</h3>
              <p className="mt-3 leading-7 text-gray-600">{text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="px-4 py-14 text-center">
        <Target className="mx-auto h-10 w-10 text-blue-700" />
        <h2 className="mt-4 text-2xl font-black text-gray-900">Our purpose</h2>
        <p className="mx-auto mt-3 max-w-2xl leading-7 text-gray-600">Make school information easier to find and help authorised school teams manage their online presence in one organised place.</p>
        <div className="mt-6 flex justify-center"><a href="/schools" className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800">Explore Schools</a></div>
      </section>
    </div>
  );
}
