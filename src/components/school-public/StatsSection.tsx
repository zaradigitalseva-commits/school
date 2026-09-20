import { GraduationCap, BookOpen, Users, Award } from 'lucide-react';

type Props = {
  totalStudents: number;
  totalTeachers: number;
  foundedYear: string;
};

export default function StatsSection({ totalStudents, totalTeachers, foundedYear }: Props) {
  return (<section className="relative -mt-8 z-20 px-4">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                icon: Users,
                label: 'Students',
                value: totalStudents,
                box: 'bg-blue-50',
                iconColor: 'text-blue-600',
              },
              {
                icon: GraduationCap,
                label: 'Teachers',
                value: totalTeachers,
                box: 'bg-emerald-50',
                iconColor: 'text-emerald-600',
              },
              {
                icon: BookOpen,
                label: 'Learning',
                value: '12+',
                box: 'bg-amber-50',
                iconColor: 'text-amber-600',
              },
              {
                icon: Award,
                label: 'Founded',
                value: foundedYear,
                box: 'bg-rose-50',
                iconColor: 'text-rose-600',
              },
            ].map((stat, index) => {
              const Icon = stat.icon;

              return (
                <div
                  key={index}
                  className="rounded-2xl bg-white p-5 text-center shadow-xl transition duration-300 hover:-translate-y-1 hover:shadow-2xl"
                >
                  <div
                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${stat.box}`}
                  >
                    <Icon className={`h-6 w-6 ${stat.iconColor}`} />
                  </div>

                  <p className="text-2xl font-black text-gray-900">
                    {stat.value}
                  </p>

                  <p className="text-sm font-medium text-gray-500">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
  );
}
