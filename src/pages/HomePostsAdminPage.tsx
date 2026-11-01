import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle, ImagePlus, Megaphone, Pencil, Send, Trash2, X, XCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createHomePost, deleteHomePost, fetchAllSchools, fetchMyAdminSchools, fetchSchoolById, isPlatformAdminEmail, moderateHomePost, subscribeToManagedHomePosts, updateHomePost } from '@/firebase/firestore';
import type { HomePost, School } from '@/firebase/types';

const MAX_IMAGE_CHARS = 620000;
async function compressPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('कृपया JPG, PNG या WebP फोटो चुनें।');
  if (file.size > 10 * 1024 * 1024) throw new Error('फोटो 10 MB से छोटी होनी चाहिए।');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = source;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('फोटो खुल नहीं पाई।'));
    });
    let scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement('canvas');
    for (let attempt = 0; attempt < 7; attempt++) {
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Photo compression उपलब्ध नहीं है।');
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const data = canvas.toDataURL('image/jpeg', Math.max(0.42, 0.78 - attempt * 0.06));
      if (data.length <= MAX_IMAGE_CHARS) return data;
      scale *= 0.82;
    }
    throw new Error('फोटो अभी भी बड़ी है। कृपया छोटी फोटो चुनें।');
  } finally {
    URL.revokeObjectURL(source);
  }
}

export default function HomePostsAdminPage() {
  const { user, isPlatformAdmin } = useAuth();
  const [params] = useSearchParams();
  const requested = params.get('schoolId') || '';
  const [schoolId, setSchoolId] = useState('');
  const [schoolName, setSchoolName] = useState('SchoolConnect');
  const [schools, setSchools] = useState<School[]>([]);
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [editing, setEditing] = useState<HomePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const platform = isPlatformAdmin || isPlatformAdminEmail(user?.email);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        if (platform) {
          const all = await fetchAllSchools();
          if (!active) return;
          setSchools(all.filter(s => s.status === 'LIVE'));
          const selected = all.find(s => s.id === requested);
          if (selected) { setSchoolId(selected.id); setSchoolName(selected.name); }
        } else {
          const ids = await fetchMyAdminSchools(user.uid, user.email || '');
          if (!active) return;
          const id = ids[0] || '';
          if (!id) throw new Error('Aapke account se koi school admin nahi mila.');
          const school = await fetchSchoolById(id);
          if (!active) return;
          if (!school || school.ownerUid !== user.uid || school.status !== 'LIVE') throw new Error('Aapka school abhi LIVE nahi hai.');
          setSchoolId(id);
          setSchoolName(school.name);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'School details load nahi hue.');
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => { active = false; };
  }, [user, platform, requested]);

  useEffect(() => {
    if (platform) return subscribeToManagedHomePosts(setPosts, undefined, e => setError(e.message));
    if (schoolId) return subscribeToManagedHomePosts(setPosts, schoolId, e => setError(e.message));
    return undefined;
  }, [platform, schoolId]);

  const pending = useMemo(() => posts.filter(p => p.status === 'PENDING').length, [posts]);
  function resetForm() { setEditing(null); setTitle(''); setContent(''); setImageUrl(''); }
  function startEdit(post: HomePost) {
    setEditing(post); setTitle(post.title); setContent(post.content); setImageUrl(post.imageUrl || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setPhotoBusy(true); setError('');
    try { setImageUrl(await compressPhoto(file)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Photo upload नहीं हुई।'); }
    finally { setPhotoBusy(false); }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const input = { title, content, imageUrl, schoolId: platform ? (schoolId || null) : schoolId, schoolName: platform ? (schoolId ? schoolName : 'SchoolConnect') : schoolName, authorName: user.displayName || '' };
      if (editing) {
        await updateHomePost(editing.id, input, user.uid);
        setNotice(!platform ? 'सुधार भेज दिया गया है। पोस्ट दोबारा Approval के लिए Pending है।' : 'पोस्ट अपडेट हो गई।');
      } else {
        await createHomePost({ ...input, publishImmediately: platform }, user.uid);
        setNotice(platform ? 'पोस्ट Publish हो गई और Home Page पर live है।' : 'पोस्ट Super Admin Approval के लिए भेज दी गई।');
      }
      resetForm();
    } catch (e) { setError(e instanceof Error ? e.message : 'Post submit नहीं हुई।'); }
    finally { setSaving(false); }
  }
  async function moderate(post: HomePost, status: 'APPROVED' | 'REJECTED') {
    setError(''); setNotice('');
    try { await moderateHomePost(post.id, status); setNotice(status === 'APPROVED' ? 'पोस्ट approve होकर live हो गई।' : 'पोस्ट reject कर दी गई।'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Action failed.'); }
  }
  async function remove(post: HomePost) {
    if (!window.confirm('इस पोस्ट को delete करना है?')) return;
    setError('');
    try { await deleteHomePost(post.id); if (editing?.id === post.id) resetForm(); setNotice('पोस्ट delete हो गई।'); }
    catch (e) { setError(e instanceof Error ? e.message : 'Delete failed.'); }
  }
  const dateText = (value: any) => {
    try { return typeof value?.toDate === 'function' ? value.toDate().toLocaleString('en-IN') : 'Recently'; }
    catch { return 'Recently'; }
  };

  if (loading) return <div className="min-h-screen grid place-items-center font-bold text-blue-700">Loading post workspace...</div>;
  return <main className="min-h-screen bg-slate-50 px-4 py-8"><div className="mx-auto max-w-5xl">
    <Link to={platform ? '/admin' : '/school-admin'} className="mb-5 inline-flex items-center gap-2 font-bold text-blue-700"><ArrowLeft className="h-4 w-4"/>Dashboard पर वापस</Link>
    <header className="mb-7 rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-700 p-6 text-white shadow-xl">
      <div className="flex items-center gap-3"><Megaphone className="h-8 w-8"/><div><h1 className="text-2xl font-black">Home Page Posts</h1><p className="text-sm">{platform ? 'Super Admin: Publish और Approval' : schoolName + ' — Approval के बाद live'}</p></div></div>
      {platform && <p className="mt-3 font-bold">Pending: {pending}</p>}
    </header>
    {error && <p role="alert" className="mb-4 rounded-xl bg-red-50 p-4 text-red-700">{error}</p>}
    {notice && <p role="status" className="mb-4 rounded-xl bg-green-50 p-4 text-green-700">{notice}</p>}
    <section className="mb-8 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-xl font-extrabold">{editing ? 'पोस्ट में सुधार करें' : platform ? 'नई पोस्ट बनाएं और Publish करें' : 'Approval के लिए पोस्ट भेजें'}</h2>
      {platform && <label className="mb-4 block text-sm font-bold">पोस्ट किस नाम से दिखानी है?
        <select value={schoolId} onChange={e => { setSchoolId(e.target.value); setSchoolName(schools.find(s => s.id === e.target.value)?.name || 'SchoolConnect'); }} className="mt-1 w-full rounded-xl border p-3">
          <option value="">SchoolConnect (Platform)</option>{schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>}
      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm font-bold">पोस्ट का शीर्षक
          <input required maxLength={120} value={title} onChange={e => setTitle(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/>
        </label>
        <label className="block text-sm font-bold">पोस्ट की जानकारी
          <textarea required maxLength={5000} rows={5} value={content} onChange={e => setContent(e.target.value)} className="mt-1 w-full rounded-xl border p-3"/>
        </label>
        <div className="rounded-xl border border-dashed p-4">
          <div className="flex flex-wrap items-center gap-3"><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 font-bold text-blue-700"><ImagePlus className="h-4 w-4"/>फोटो Upload करें<input type="file" accept="image/*" onChange={e => void choosePhoto(e)} className="sr-only"/></label>
            {photoBusy && <span className="text-sm text-blue-700">फोटो छोटी की जा रही है…</span>}
            {imageUrl && <button type="button" onClick={() => setImageUrl('')} className="inline-flex items-center gap-1 text-sm font-bold text-red-600"><X className="h-4 w-4"/>फोटो हटाएं</button>}
          </div>
          <p className="mt-2 text-xs text-gray-500">फोटो अपने आप compress होगी ताकि वेबसाइट और Firestore पर कम जगह लगे।</p>
          {imageUrl && <img src={imageUrl} alt="Post preview" className="mt-3 max-h-56 max-w-full rounded-xl object-contain"/>}
        </div>
        <div className="flex flex-wrap gap-2"><button disabled={saving || photoBusy} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white disabled:opacity-50"><Send className="h-4 w-4"/>{saving ? 'Saving…' : editing ? 'सुधार Save करें' : platform ? 'Publish Now' : 'Approval के लिए भेजें'}</button>
          {editing && <button type="button" onClick={resetForm} className="rounded-xl border px-5 py-3 font-bold">Cancel</button>}
        </div>
      </form>
    </section>
    <section className="space-y-4"><h2 className="text-xl font-extrabold">{platform ? 'सभी स्कूलों की पोस्ट' : 'आपके स्कूल की पोस्ट'}</h2>
      {!posts.length && <p className="rounded-xl border bg-white p-6 text-center text-gray-500">अभी कोई पोस्ट नहीं है।</p>}
      {posts.map(post => {
        const canEdit = platform || (post.authorUid === user?.uid && ['PENDING', 'REJECTED'].includes(post.status));
        const canDelete = platform || (post.authorUid === user?.uid && ['PENDING', 'REJECTED'].includes(post.status));
        return <article key={post.id} className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold text-blue-700">{post.schoolName || 'SchoolConnect'} • {dateText(post.createdAt)}</p><h3 className="text-lg font-extrabold">{post.title}</h3></div><b className="rounded-full bg-slate-100 px-3 py-1 text-xs">{post.status}</b></div>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm text-gray-700">{post.content}</p>
          {post.imageUrl && <img src={post.imageUrl} alt={post.title} className="mt-3 max-h-64 max-w-full rounded-xl object-contain"/>}
          <div className="mt-4 flex flex-wrap gap-2">
            {canEdit && <button onClick={() => startEdit(post)} className="inline-flex items-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold"><Pencil className="h-4 w-4"/>Edit</button>}
            {platform && post.status === 'PENDING' && <><button onClick={() => void moderate(post, 'APPROVED')} className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-4 py-2 font-bold text-white"><CheckCircle className="h-4 w-4"/>Approve</button><button onClick={() => void moderate(post, 'REJECTED')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-4 py-2 font-bold text-white"><XCircle className="h-4 w-4"/>Reject</button></>}
            {platform && post.status === 'REJECTED' && <button onClick={() => void moderate(post, 'PENDING' as 'REJECTED')} className="rounded-lg border px-3 py-2 text-sm font-bold">Review again</button>}
            {canDelete && <button onClick={() => void remove(post)} className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold text-red-600"><Trash2 className="h-4 w-4"/>Delete</button>}
          </div>
        </article>;
      })}
    </section>
  </div></main>;
}
