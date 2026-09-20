import type { School } from '@/firebase/types';
import { GraduationCap, ArrowRight } from 'lucide-react';

type Props = {
  school: School;
  heroImage: string;
};

export default function HeroSection({ school, heroImage }: Props) {
  return (
{/* =========================================================
          HERO
      ========================================================== */}
      <section
        id="home"
        className="relative flex min-h-[650px] items-center justify-center overflow-hidden"
      >
        <img
          src={heroImage}
          alt={school.name}
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/90 via-purple-900/70 to-black/75" />

        <div className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 text-center text-white">
          {school.logoUrl ? (
            <img
              src={school.logoUrl}
              alt={`${school.name} logo`}
              className="mx-auto mb-7 h-28 w-28 rounded-3xl border-4 border-white object-cover shadow-2xl sm:h-36 sm:w-36"
            />
          ) : (
            <div className="mx-auto mb-7 flex h-28 w-28 items-center justify-center rounded-3xl bg-white/15 text-7xl shadow-2xl backdrop-blur-md">
              🏫
            </div>
          )}

          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-bold shadow-xl backdrop-blur-md">
            <GraduationCap className="h-4 w-4" />
            Welcome to {school.name}
          </div>

          <h2 className="text-4xl font-black leading-tight drop-shadow-2xl sm:text-5xl lg:text-6xl">
            {school.tagline || `Welcome to ${school.name}`}
          </h2>

          {school.description && (
            <p className="mx-auto mt-6 max-w-3xl text-base leading-7 text-blue-50 sm:text-lg">
              {school.description.slice(0, 220)}
              {school.description.length > 220 ? '...' : ''}
            </p>
          )}

          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="#about"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 font-black text-blue-700 shadow-[0_6px_0_rgb(156,163,175)] transition hover:bg-blue-50 active:translate-y-1 active:shadow-none"
            >
              Learn More
              <ArrowRight className="h-5 w-5" />
            </a>

            <a
              href="#contact"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-7 py-3.5 font-black text-white shadow-[0_6px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none"
            >
              Contact School
            </a>
          </div>
        </div>
      </section>
  );
}
