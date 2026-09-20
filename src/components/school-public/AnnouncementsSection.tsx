import type { Announcement } from '@/firebase/types';
import { Megaphone } from 'lucide-react';
import { formatDate } from '@/firebase/firestore';

type Props = {
  announcements: Announcement[];
  contentLoading: boolean;
};

export default function AnnouncementsSection({ announcements, contentLoading }: Props) {
  return (<section id="notices" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-blue-600">
              <Megaphone className="h-4 w-4" />
              Latest News
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              School Notices & Announcements
            </h2>
          </div>

          {contentLoading ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <p className="font-bold text-gray-500">
                Loading notices...
              </p>
            </div>
          ) : announcements.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-3">
              {announcements.map((announcement) => (
                <div
                  key={announcement.id}
                  className="rounded-2xl bg-white p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className={`mb-4 inline-block rounded-full px-3 py-1 text-xs font-black ${
                      announcement.priority === 'high'
                        ? 'bg-red-50 text-red-600'
                        : announcement.priority === 'medium'
                          ? 'bg-amber-50 text-amber-600'
                          : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {announcement.priority} priority
                  </div>

                  <h3 className="text-lg font-black text-gray-900">
                    {announcement.title}
                  </h3>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                    {announcement.content}
                  </p>

                  <p className="mt-4 text-xs font-semibold text-gray-400">
                    {formatDate(announcement.date)}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <Megaphone className="mx-auto h-10 w-10 text-blue-400" />

              <p className="mt-3 font-bold text-gray-600">
                No announcements available.
              </p>
            </div>
          )}
        </div>
      </section>
  );
}
