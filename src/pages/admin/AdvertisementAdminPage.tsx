import { ArrowLeft, Megaphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdvertisementAdminPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-pink-950 p-4 md:p-8 text-white">
      <div className="mx-auto max-w-6xl">

        <button
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Super Admin
        </button>

        <div className="rounded-3xl bg-white/10 p-8 text-center shadow-2xl backdrop-blur">

          <Megaphone className="mx-auto mb-4 h-16 w-16" />

          <h1 className="text-3xl font-black">
            Advertisement Admin
          </h1>

          <p className="mt-3 text-white/70">
            यहाँ Platform के Paid Advertisements manage होंगे।
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">

            <div className="rounded-2xl bg-white/10 p-6">
              <div className="text-4xl">🖼️</div>

              <h2 className="mt-3 text-xl font-bold">
                Advertisement Slider
              </h2>

              <p className="mt-2 text-sm text-white/60">
                Admin कई advertisement images upload करेगा।
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 p-6">
              <div className="text-4xl">📢</div>

              <h2 className="mt-3 text-xl font-bold">
                Scrolling Advertisement
              </h2>

              <p className="mt-2 text-sm text-white/60">
                Colourful 3D scrolling advertisement यहाँ manage होगा।
              </p>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
