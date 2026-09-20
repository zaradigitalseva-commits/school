import type { School } from '@/firebase/types';
import { Images } from 'lucide-react';

type Props = {
  school: School;
  campusImages: string[];
};

export default function GallerySection({ school, campusImages }: Props) {
  return (
{/* =========================================================
          GALLERY
      ========================================================== */}
      <section id="gallery" className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10">
            <span className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-pink-600">
              <Images className="h-4 w-4" />
              School Gallery
            </span>

            <h2 className="mt-2 text-3xl font-black text-gray-900 sm:text-4xl">
              Campus & Activities
            </h2>
          </div>

          {campusImages.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {campusImages.slice(0, 8).map((image, index) => (
                <div
                  key={index}
                  className="group overflow-hidden rounded-2xl shadow-lg"
                >
                  <img
                    src={image}
                    alt={`${school.name} gallery ${index + 1}`}
                    className="h-52 w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl bg-gradient-to-br from-pink-50 to-purple-50 p-12 text-center">
              <Images className="mx-auto h-12 w-12 text-pink-400" />

              <p className="mt-4 font-bold text-gray-600">
                School gallery images will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
  );
}
