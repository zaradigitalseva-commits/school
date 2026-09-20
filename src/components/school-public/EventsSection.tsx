import type { SchoolEvent } from '@/firebase/types';
import { CalendarDays } from 'lucide-react';
import { formatDate } from '@/firebase/firestore';

type Props = {
  events: SchoolEvent[];
};

export default function EventsSection({ events }: Props) {
  return (
    <section id="events" className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-10">
          <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-purple-600">
            <CalendarDays className="h-4 w-4" />
            What's Happening
          </span>

          <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
            Upcoming School Events
          </h2>
        </div>

        {events.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-3">
            {events.map((event) => (
              <div
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-lg ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
              >
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="h-44 w-full object-cover"
                  />
                )}

                <div className="p-6">
                  <h3 className="font-black text-gray-900">
                    {event.title}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-500">
                    {event.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2 text-xs font-semibold text-gray-400">
                    <CalendarDays className="h-4 w-4" />
                    {formatDate(event.date)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl bg-gray-50 p-10 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-purple-400" />

            <p className="mt-3 font-bold text-gray-600">
              No upcoming events available.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
