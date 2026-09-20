import type { School } from '@/firebase/types';
import { Trophy, Heart, Lightbulb, ShieldCheck } from 'lucide-react';

type Props = {
  school: School;
  campusImages: string[];
  heroImage: string;
};

export default function AboutSection({ school, campusImages, heroImage }: Props) {
  return (
{/* =========================================================
          ABOUT
      ========================================================== */}
      <section id="about" className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                About Our School
              </span>

              <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
                A Place Where Education Meets Excellence
              </h2>

              <div className="mt-4 h-1.5 w-24 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500" />

              <p className="mt-6 whitespace-pre-line text-base leading-8 text-gray-600">
                {school.description ||
                  `${school.name} is committed to providing quality education and creating a positive learning environment for students.`}
              </p>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
                {[
                  {
                    icon: Heart,
                    title: 'Caring Environment',
                    desc: 'Supportive school community',
                  },
                  {
                    icon: Lightbulb,
                    title: 'Innovative Learning',
                    desc: 'Modern teaching methods',
                  },
                  {
                    icon: ShieldCheck,
                    title: 'Safe Campus',
                    desc: 'Secure and welcoming',
                  },
                  {
                    icon: Trophy,
                    title: 'Student Excellence',
                    desc: 'Focus on achievement',
                  },
                ].map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={index}
                      className="flex gap-3 rounded-2xl bg-white p-4 shadow-md"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>

                      <div>
                        <h3 className="text-sm font-black text-gray-900">
                          {item.title}
                        </h3>

                        <p className="mt-1 text-xs text-gray-500">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              {campusImages.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {campusImages.slice(0, 4).map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`${school.name} campus ${index + 1}`}
                      className={`w-full rounded-2xl object-cover shadow-xl ${
                        index % 2 === 0 ? 'mt-8 h-52' : 'h-60'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-3xl shadow-2xl">
                  <img
                    src={heroImage}
                    alt={`${school.name} campus`}
                    className="h-[420px] w-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
  );
}
