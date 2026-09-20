import type { School, Announcement, SchoolEvent, Teacher } from '@/firebase/types';
import { MapPin, Phone, Mail } from 'lucide-react';

type Props = {
  school: School;
};

export default function ContactSection({ school }: Props) {
  return (
{/* =========================================================
          CONTACT
      ========================================================== */}
      <section id="contact" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <span className="text-sm font-black uppercase tracking-wider text-blue-600">
              Get In Touch
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Contact {school.name}
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Address
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {school.address || 'School address not added yet.'}
              </p>
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50">
                <Phone className="h-6 w-6 text-green-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Phone
              </h3>

              {school.phone ? (
                <a
                  href={`tel:${school.phone}`}
                  className="mt-2 block text-sm font-bold text-green-600"
                >
                  {school.phone}
                </a>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Phone not added yet.
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white p-6 text-center shadow-lg">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-50">
                <Mail className="h-6 w-6 text-purple-600" />
              </div>

              <h3 className="mt-4 font-black text-gray-900">
                Email
              </h3>

              {school.email ? (
                <a
                  href={`mailto:${school.email}`}
                  className="mt-2 block break-all text-sm font-bold text-purple-600"
                >
                  {school.email}
                </a>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  Email not added yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
  );
}
