import { FormEvent, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Megaphone,
  Trash2,
  Image as ImageIcon,
  ScrollText,
} from 'lucide-react';

import {
  createPlatformAd,
  deletePlatformAd,
  fetchAllPlatformAds,
  type PlatformAd,
} from '@/firebase/firestore';

export default function AdvertisementManagerPage() {
  const [ads, setAds] = useState<PlatformAd[]>([]);
  const [type, setType] = useState<'scrolling' | 'slider'>('scrolling');
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [order, setOrder] = useState('0');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setLoading(true);
      setAds(await fetchAllPlatformAds());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load advertisements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      setSaving(true);

      await createPlatformAd({
        type,
        text: type === 'scrolling' ? text : '',
        imageUrl: type === 'slider' ? imageUrl : '',
        linkUrl,
        order: Number(order) || 0,
        active,
      });

      setText('');
      setImageUrl('');
      setLinkUrl('');
      setOrder('0');
      setMessage('Advertisement saved successfully.');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save advertisement.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this advertisement?')) return;

    try {
      setError('');
      await deletePlatformAd(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete advertisement.');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-purple-950 p-4 text-white md:p-8">
      <div className="mx-auto max-w-6xl">
        <Link
          to="/admin"
          className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 font-black hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Admin
        </Link>

        <div className="rounded-3xl bg-white/10 p-5 shadow-2xl backdrop-blur md:p-8">
          <div className="text-center">
            <Megaphone className="mx-auto h-14 w-14" />
            <h1 className="mt-3 text-3xl font-black">Platform Advertisements</h1>
            <p className="mt-2 text-white/70">
              Scrolling text अलग text में रहेगा — image के रूप में नहीं।
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="mt-8 rounded-3xl bg-white p-5 text-slate-900 shadow-xl"
          >
            <h2 className="text-xl font-black">Add Advertisement</h2>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="font-bold">
                Type
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as 'scrolling' | 'slider')}
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                >
                  <option value="scrolling">Scrolling Text</option>
                  <option value="slider">Slider Image</option>
                </select>
              </label>

              {type === 'scrolling' ? (
                <label className="font-bold md:col-span-2">
                  Scrolling Text
                  <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    rows={3}
                    placeholder="जैसे: Admission Open • Contact School • New Announcement..."
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </label>
              ) : (
                <label className="font-bold md:col-span-2">
                  Image URL
                  <input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-2 w-full rounded-xl border px-4 py-3"
                  />
                </label>
              )}

              <label className="font-bold">
                Link URL (optional)
                <input
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                />
              </label>

              <label className="font-bold">
                Order
                <input
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(e.target.value)}
                  className="mt-2 w-full rounded-xl border px-4 py-3"
                />
              </label>
            </div>

            <label className="mt-4 flex items-center gap-3 font-black">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="h-5 w-5"
              />
              Show on platform home
            </label>

            <button
              disabled={saving}
              className="mt-5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-black text-white shadow-[0_5px_0_rgb(67,56,202)] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Advertisement'}
            </button>
          </form>

          {message && (
            <div className="mt-4 rounded-2xl bg-green-500/20 p-4 font-bold">
              ✅ {message}
            </div>
          )}

          {error && (
            <div className="mt-4 rounded-2xl bg-red-500/20 p-4 font-bold">
              ❌ {error}
            </div>
          )}

          <section className="mt-8">
            <h2 className="text-2xl font-black">Existing Advertisements</h2>

            {loading ? (
              <p className="mt-4 text-white/70">Loading...</p>
            ) : ads.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-white/10 p-5 text-white/70">
                No advertisements added yet.
              </p>
            ) : (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="rounded-2xl bg-white/10 p-5 shadow-lg"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-black">
                        {ad.type === 'scrolling' ? (
                          <ScrollText className="h-5 w-5" />
                        ) : (
                          <ImageIcon className="h-5 w-5" />
                        )}
                        {ad.type === 'scrolling'
                          ? 'Scrolling Text'
                          : 'Slider Image'}
                      </div>

                      <button
                        onClick={() => handleDelete(ad.id)}
                        className="rounded-xl bg-red-500/20 p-2 text-red-200 hover:bg-red-500/40"
                        aria-label="Delete advertisement"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>

                    {ad.type === 'scrolling' ? (
                      <p className="mt-4 font-bold">{ad.text}</p>
                    ) : (
                      <img
                        src={ad.imageUrl}
                        alt="Platform advertisement"
                        className="mt-4 h-40 w-full rounded-xl object-cover"
                      />
                    )}

                    <p className="mt-3 text-xs font-bold text-white/60">
                      {ad.active ? 'ACTIVE' : 'HIDDEN'} • Order {ad.order || 0}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
