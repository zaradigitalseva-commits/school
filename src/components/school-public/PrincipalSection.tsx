import type { School } from '@/firebase/types';

type Props = {
  school: School;
};

export default function PrincipalSection({ school }: Props) {
  return (
{/* =========================================================
          PRINCIPAL
      ========================================================== */}
      {(school.principalName || school.principalMessage) && (
        <section id="principal" className="bg-white py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-7 shadow-2xl sm:p-12">
              <div className="grid items-center gap-8 sm:grid-cols-3">
                <div>
                  {school.principalImageUrl ? (
                    <img
                      src={school.principalImageUrl}
                      alt={school.principalName || 'Principal'}
                      className="mx-auto h-48 w-48 rounded-3xl object-cover shadow-xl"
                    />
                  ) : (
                    <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-7xl shadow-xl">
                      👨‍🏫
                    </div>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <span className="text-sm font-black uppercase tracking-wider text-blue-600">
                    Principal's Message
                  </span>

                  <h2 className="mt-2 text-2xl font-black text-gray-900 sm:text-3xl">
                    {school.principalName || 'School Principal'}
                  </h2>

                  {school.principalMessage && (
                    <p className="mt-5 text-base leading-8 text-gray-600 italic">
                      "{school.principalMessage}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
  );
}
