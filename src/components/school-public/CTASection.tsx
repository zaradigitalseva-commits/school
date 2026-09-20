import type { School, Announcement, SchoolEvent, Teacher } from '@/firebase/types';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  school: School;
  teachers: Teacher[];
};

export default function CTASection({ school, teachers }: Props) {
  return (
{/* =========================================================
          CTA
      ========================================================== */}
      <section className="bg-gradient-to-br from-blue-700 via-purple-700 to-pink-600 py-20">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="text-5xl">🎓</div>

          <h2 className="mt-5 text-3xl font-black text-white sm:text-4xl">
            Welcome to {school.name}
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-blue-50">
            Explore our school, discover our programs, meet our teachers,
            and stay updated with the latest school activities.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-blue-700 shadow-[0_6px_0_rgb(156,163,175)] transition hover:bg-blue-50 active:translate-y-1 active:shadow-none"
            >
              Contact School
              <ArrowRight className="h-5 w-5" />
            </a>

            <Link
              to="/schools"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-500 px-7 py-3.5 font-black text-white shadow-[0_6px_0_rgb(4,120,87)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              🔎 Other Schools
            </Link>
          </div>
        </div>
      </section>
  );
}
