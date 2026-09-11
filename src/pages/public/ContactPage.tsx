import { useState } from 'react';
import { Mail, Phone, MapPin, Send, Clock } from 'lucide-react';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import { useToast } from '@/components/ui/Toast';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ContactPage() {
  const { info, loading } = useSchoolInfo();
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      showToast('Please fill in all fields.', 'warning');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setForm({ name: '', email: '', message: '' });
      showToast('Your message has been sent! We will get back to you soon.', 'success');
    }, 1000);
  };

  if (loading) return <LoadingSpinner fullScreen label="Loading..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[350px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.heroImageUrl} alt="Contact" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Get in Touch</h1>
          <p className="text-blue-100 max-w-xl mx-auto">We would love to hear from you. Reach out with any questions.</p>
        </div>
      </section>

      {/* Contact info + form */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Info */}
            <div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Contact Information</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-6">Reach Out to Us</h2>
              <div className="space-y-4">
                {[
                  { icon: MapPin, label: 'Address', value: info.address, color: 'blue' },
                  { icon: Phone, label: 'Phone', value: info.phone, color: 'emerald' },
                  { icon: Mail, label: 'Email', value: info.email, color: 'amber' },
                  { icon: Clock, label: 'Office Hours', value: 'Mon - Fri: 8:00 AM - 4:00 PM', color: 'rose' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 card-shadow">
                    <div className={`w-12 h-12 rounded-xl bg-${item.color}-50 flex items-center justify-center shrink-0`}>
                      <item.icon className={`w-6 h-6 text-${item.color}-600`} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                      <p className="text-gray-700 font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form */}
            <div>
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Send a Message</span>
              <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-6">Contact Form</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                  <textarea
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder="How can we help you?"
                  />
                </div>
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold btn-3d hover:bg-blue-700 disabled:opacity-60 inline-flex items-center justify-center gap-2"
                >
                  {sending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" /> Send Message
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
