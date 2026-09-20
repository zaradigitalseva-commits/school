import type { School } from '@/firebase/types';
import { GraduationCap, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  school: School;
};

export default function SchoolHeader({ school }: Props) {
  return (<header className="sticky top-0 z-50 border-b border-white/20 bg-white/95 shadow-lg backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to={`/school/${school.slug}`}
            className="flex min-w-0 items-center gap-3"
          >
            {school.logoUrl ? (
              <img
                src={school.logoUrl}
                alt={`${school.name} logo`}
                className="h-12 w-12 rounded-xl border-2 border-blue-100 object-cover shadow-md"
              />
            ) : (
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl shadow-[0_4px_0_rgb(67,56,202)]">
                🏫
              </div>
            )}

            <div className="min-w-0">
              <h1 className="truncate text-base font-black text-gray-900 sm:text-lg">
                {school.name}
              </h1>

              {school.tagline && (
                <p className="truncate text-xs font-medium text-blue-600">
                  {school.tagline}
                </p>
              )}
            </div>
          </Link>

          <Link
            to="/schools"
            className="hidden items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-black text-white shadow-[0_4px_0_rgb(67,56,202)] transition hover:brightness-110 active:translate-y-1 active:shadow-none sm:inline-flex"
          >
            <GraduationCap className="h-4 w-4" />
            All Schools
          </Link>
        </div>

        {/* Mobile / Desktop menu */}
        <div className="border-t border-gray-100 bg-white">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2 sm:px-6">
            <a
              href="#home"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"
            >
              Home
            </a>

            <a
              href="#about"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              About
            </a>

            <a
              href="#principal"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Principal
            </a>

            <a
              href="#notices"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Notices
            </a>

            <a
              href="#events"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Events
            </a>

            <a
              href="#teachers"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Teachers
            </a>

            <a
              href="#results"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Results
            </a>

            <a
              href="#gallery"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Gallery
            </a>

            <a
              href="#contact"
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700"
            >
              Contact
            </a>
          </div>
        </div>
      </header>
  );
}
