import { useState } from 'react';
import { Mail, Send, ShieldCheck } from 'lucide-react';

const SUPPORT_EMAIL = 'zaradigitalseva@gmail.com';

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subject = encodeURIComponent('SchoolConnect website enquiry');
    const body = encodeURIComponent(
      `Name: ${form.name}\nReply email: ${form.email}\n\nMessage:\n${form.message}`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="animate-fade-in">
      <section className="bg-gradient-to-br from-blue-800 via-indigo-800 to-slate-900 px-4 py-20 text-center text-white">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-200">SchoolConnect Support</p>
        <h1 className="mt-3 text-4xl font-black sm:text-5xl">Contact Us</h1>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-blue-100">
          Have a question about the platform, school registration or account access? Send us a message.
        </p>
      </section>

      <section className="bg-gray-50 px-4 py-14">
        <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-white p-7 shadow-lg sm:p-9">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
              <Mail className="h-6 w-6 text-blue-700" />
            </div>
            <h2 className="mt-5 text-2xl font-extrabold text-gray-900">Email Support</h2>
            <p className="mt-3 leading-7 text-gray-600">
              For platform support, account questions and general enquiries, contact our support email.
            </p>
            <a className="mt-5 inline-block break-all font-bold text-blue-700 underline" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            <p className="mt-6 text-sm leading-6 text-gray-500">
              For questions about a particular school's timings, admission, fees or notices, please contact that school using the contact details on its public school page.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-7 shadow-lg sm:p-9">
            <h2 className="text-2xl font-extrabold text-gray-900">Send an Enquiry</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              Submitting opens your email application with the message prepared. You can review it before sending.
            </p>
            <label className="mt-6 block text-sm font-semibold text-gray-700">
              Your name
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="Enter your name" />
            </label>
            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Your email
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="you@example.com" />
            </label>
            <label className="mt-4 block text-sm font-semibold text-gray-700">
              Message
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="mt-2 w-full resize-y rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" placeholder="How can we help?" />
            </label>
            <button type="submit" className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white shadow-lg transition hover:bg-blue-800">
              <Send className="h-4 w-4" /> Prepare Email
            </button>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-gray-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Your email application handles the actual sending; this website does not claim a message was delivered.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
