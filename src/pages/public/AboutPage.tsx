import { Target, Eye, Heart, Award, Users, BookOpen, Lightbulb, ShieldCheck } from 'lucide-react';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function AboutPage() {
  const { info, loading } = useSchoolInfo();

  if (loading) return <LoadingSpinner fullScreen label="Loading..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.heroImageUrl} alt="Campus" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">About Our School</h1>
          <p className="text-blue-100 max-w-xl mx-auto">{info.tagline}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Our Story</span>
          <h2 className="text-3xl font-bold text-gray-900 mt-2 mb-6">A Tradition of Excellence Since {info.foundedYear}</h2>
          <p className="text-gray-600 leading-relaxed text-lg mb-6">{info.description}</p>
          <p className="text-gray-600 leading-relaxed">
            Over the years, we have grown from a small community school into a renowned institution,
            serving thousands of students with dedication and passion. Our commitment to holistic
            education ensures that every student not only excels academically but also develops the
            character and skills needed for a successful future.
          </p>
        </div>
      </section>

      {/* Mission, Vision, Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Our Mission', desc: 'To provide quality education that empowers students to become confident, compassionate, and capable individuals ready to face the challenges of tomorrow.', color: 'blue' },
              { icon: Eye, title: 'Our Vision', desc: 'To be a leading educational institution recognized for academic excellence, innovative teaching, and producing well-rounded global citizens.', color: 'emerald' },
              { icon: Heart, title: 'Our Values', desc: 'Integrity, respect, excellence, and inclusivity guide everything we do. We believe in nurturing the whole child.', color: 'rose' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 card-shadow card-shadow-hover">
                <div className={`w-14 h-14 rounded-2xl bg-${item.color}-50 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Principal */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-blue-50 to-gray-50 rounded-3xl p-8 sm:p-12 card-shadow">
            <div className="grid sm:grid-cols-3 gap-8 items-center">
              <div className="sm:col-span-1">
                <img src={info.principalImageUrl} alt={info.principalName} className="w-48 h-48 rounded-2xl object-cover card-shadow mx-auto" />
              </div>
              <div className="sm:col-span-2">
                <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Principal's Message</span>
                <h2 className="text-2xl font-bold text-gray-900 mt-2 mb-3">{info.principalName}</h2>
                <p className="text-gray-600 leading-relaxed italic">"{info.principalMessage}"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">What Sets Us Apart</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: 'Academic Excellence', desc: 'Consistently achieving outstanding results in academics and competitions.', color: 'amber' },
              { icon: Users, title: 'Expert Faculty', desc: 'Dedicated and highly qualified teachers committed to student success.', color: 'blue' },
              { icon: BookOpen, title: 'Rich Curriculum', desc: 'Comprehensive programs covering academics, arts, and athletics.', color: 'emerald' },
              { icon: ShieldCheck, title: 'Safe Environment', desc: 'A secure, welcoming campus where every student feels valued.', color: 'rose' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 card-shadow card-shadow-hover text-center">
                <div className={`w-14 h-14 rounded-2xl mx-auto bg-${item.color}-50 flex items-center justify-center mb-4`}>
                  <item.icon className={`w-7 h-7 text-${item.color}-600`} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
