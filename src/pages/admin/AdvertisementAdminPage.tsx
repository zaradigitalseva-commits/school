import {
  ArrowLeft,
  Megaphone,
  Image,
  ScrollText,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdvertisementAdminPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-purple-950 to-pink-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">

        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="mb-6 flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-bold shadow-lg transition hover:bg-white/20 active:translate-y-1"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Super Admin
        </button>

        {/* Main Card */}
        <div className="rounded-3xl bg-white/10 p-5 shadow-2xl backdrop-blur md:p-8">

          {/* Header */}
          <div className="text-center">

            <Megaphone className="mx-auto mb-4 h-16 w-16" />

            <h1 className="text-3xl font-black md:text-4xl">
              Advertisement Admin
            </h1>

            <p className="mt-3 text-white/70">
              यहाँ Platform के Paid Advertisements manage होंगे।
            </p>

          </div>

          {/* Advertisement Options */}
          <div className="mt-8 grid gap-5 md:grid-cols-2">

            {/* Slider Advertisement */}
            <Link
              to="/admin/advertisements/slider"
              className="group block rounded-3xl bg-white/10 p-6 text-center shadow-xl transition hover:scale-[1.02] hover:bg-white/15 active:scale-[0.98]"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
                <Image className="h-10 w-10" />
              </div>

              <h2 className="mt-4 text-xl font-black md:text-2xl">
                Advertisement Slider
              </h2>

              <p className="mt-2 text-sm text-white/60">
                Admin कई advertisement images upload और manage करेगा।
              </p>

              <div className="mt-5 inline-block rounded-xl bg-gradient-to-r from-pink-500 via-purple-600 to-blue-600 px-6 py-3 font-black shadow-[0_5px_0_rgb(67,56,202)] transition group-hover:brightness-110 group-active:translate-y-1 group-active:shadow-none">
                Manage Slider
              </div>
            </Link>

            {/* Scrolling Advertisement */}
            <Link
              to="/admin/advertisements/scrolling"
              className="group block rounded-3xl bg-white/10 p-6 text-center shadow-xl transition hover:scale-[1.02] hover:bg-white/15 active:scale-[0.98]"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 shadow-lg">
                <ScrollText className="h-10 w-10" />
              </div>

              <h2 className="mt-4 text-xl font-black md:text-2xl">
                Scrolling Advertisement
              </h2>

              <p className="mt-2 text-sm text-white/60">
                Colourful 3D scrolling advertisement यहाँ manage होगा।
              </p>

              <div className="mt-5 inline-block rounded-xl bg-gradient-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3 font-black shadow-[0_5px_0_rgb(126,34,206)] transition group-hover:brightness-110 group-active:translate-y-1 group-active:shadow-none">
                Manage Scrolling Ad
              </div>
            </Link>

          </div>

        </div>

      </div>
    </div>
  );
}
