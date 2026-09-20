import type { School, Announcement, SchoolEvent, Teacher } from '@/firebase/types';
import { Users } from 'lucide-react';

type Props = {
  teachers: Teacher[];
};

export default function TeachersSection({ teachers }: Props) {
  return (
{/* =========================================================
          TEACHERS
      ========================================================== */}
      <section id="teachers" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-emerald-600">
              <Users className="h-4 w-4" />
              Our Team
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Meet Our Teachers
            </h2>
          </div>

          {teachers.length > 0 ? (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="overflow-hidden rounded-2xl bg-white text-center shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <img
                    src={
                      teacher.imageUrl ||
                      'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940'
                    }
                    alt={teacher.name}
                    className="h-48 w-full object-cover"
                  />

                  <div className="p-4">
                    <h3 className="text-sm font-black text-gray-900">
                      {teacher.name}
                    </h3>

                    <p className="mt-1 text-xs font-bold text-blue-600">
                      {teacher.designation}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {teacher.subject}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-white p-10 text-center shadow-lg">
              <Users className="mx-auto h-10 w-10 text-emerald-400" />

              <p className="mt-3 font-bold text-gray-600">
                Teacher information will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
  );
}
