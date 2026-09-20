import type { School } from '@/firebase/types';
import { MapPin, Phone, Mail, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

type Props = {
  school: School;
};

export default function FooterSection({ school }: Props) {
  return (
      <footer className="bg-gray-950 py-12 text-gray-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-3">
                {school.logoUrl ? (
                  <img
                    src={school.logoUrl}
                    alt={school.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-2xl">
                    🏫
                  </div>
                )}

                <h3 className="text-lg font-black text-white">
                  {school.name}
                </h3>
              </div>

              <p className="mt-4 text-sm leading-6 text-gray-400">
                {school.tagline ||
                  'Quality education, strong values and a brighter future.'}
              </p>
            </div>

            <div>
              <h3 className="font-black text-white">
                Quick Links
              </h3>

              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <a href="#home" className="hover:text-white">
                  Home
                </a>

                <a href="#about" className="hover:text-white">
                  About
                </a>

                <a href="#notices" className="hover:text-white">
                  Notices
                </a>

                <a href="#events" className="hover:text-white">
                  Events
                </a>

                <a href="#teachers" className="hover:text-white">
                  Teachers
                </a>

                <a href="#gallery" className="hover:text-white">
                  Gallery
                </a>

                <a href="#contact" className="hover:text-white">
                  Contact
                </a>

                <Link to="/schools" className="hover:text-white">
                  All Schools
                </Link>
              </div>
            </div>

            <div>
              <h3 className="font-black text-white">
                School Contact
              </h3>

              <div className="mt-4 space-y-3 text-sm text-gray-400">
                {school.address && (
                  <p className="flex gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.address}
                  </p>
                )}

                {school.phone && (
                  <p className="flex gap-2">
                    <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.phone}
                  </p>
                )}

                {school.email && (
                  <p className="flex gap-2 break-all">
                    <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                    {school.email}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-gray-800 pt-6 text-center text-xs text-gray-500">
            © {new Date().getFullYear()} {school.name}. All rights reserved.
          </div>
        </div>
      </footer>
  );
}
