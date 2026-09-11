import { BookOpen, Beaker, Palette, Music, Calculator, Globe, Trophy, GraduationCap } from 'lucide-react';
import { useSchoolInfo } from '@/hooks/useSchoolInfo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const programs = [
  { icon: BookOpen, title: 'Primary School', grades: 'Grades 1-5', desc: 'Building strong foundations in literacy, numeracy, and social skills through engaging, play-based learning.', color: 'blue' },
  { icon: Beaker, title: 'Middle School', grades: 'Grades 6-8', desc: 'Developing critical thinking and independent learning with a focus on science, technology, and the arts.', color: 'emerald' },
  { icon: GraduationCap, title: 'High School', grades: 'Grades 9-12', desc: 'Preparing students for college and careers with rigorous academics and personalized guidance.', color: 'amber' },
  { icon: Palette, title: 'Arts Program', grades: 'All Grades', desc: 'Fostering creativity through visual arts, drama, and design thinking.', color: 'rose' },
  { icon: Music, title: 'Music & Performance', grades: 'All Grades', desc: 'From choir to band to theater, students explore their musical and performance talents.', color: 'purple' },
  { icon: Trophy, title: 'Athletics', grades: 'All Grades', desc: 'A comprehensive sports program promoting teamwork, fitness, and sportsmanship.', color: 'orange' },
];

const subjects = [
  { icon: Calculator, name: 'Mathematics', color: 'blue' },
  { icon: Beaker, name: 'Science', color: 'emerald' },
  { icon: BookOpen, name: 'English & Literature', color: 'amber' },
  { icon: Globe, name: 'Social Studies', color: 'rose' },
  { icon: Palette, name: 'Fine Arts', color: 'purple' },
  { icon: Music, name: 'Music', color: 'orange' },
];

export default function AcademicsPage() {
  const { info, loading } = useSchoolInfo();

  if (loading) return <LoadingSpinner fullScreen label="Loading..." />;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative h-[400px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={info.campusImages?.[1] ?? info.heroImageUrl} alt="Academics" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 to-gray-900/80" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3">Academics</h1>
          <p className="text-blue-100 max-w-xl mx-auto">A comprehensive educational program designed to inspire and challenge every student.</p>
        </div>
      </section>

      {/* Programs */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Our Programs</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Academic Programs</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">We offer a diverse range of programs tailored to meet the needs of students at every level.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programs.map((p, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 card-shadow card-shadow-hover border border-gray-100">
                <div className={`w-14 h-14 rounded-2xl bg-${p.color}-50 flex items-center justify-center mb-4`}>
                  <p.icon className={`w-7 h-7 text-${p.color}-600`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-gray-900">{p.title}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-${p.color}-50 text-${p.color}-600 font-medium`}>{p.grades}</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subjects */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wider">Curriculum</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Subjects We Offer</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {subjects.map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-5 card-shadow card-shadow-hover text-center">
                <div className={`w-12 h-12 rounded-xl mx-auto bg-${s.color}-50 flex items-center justify-center mb-3`}>
                  <s.icon className={`w-6 h-6 text-${s.color}-600`} />
                </div>
                <p className="text-sm font-semibold text-gray-900">{s.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-br from-blue-700 to-blue-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { value: info.totalStudents, label: 'Active Students' },
              { value: info.totalTeachers, label: 'Expert Faculty' },
              { value: info.totalCourses, label: 'Courses Offered' },
              { value: '98%', label: 'Graduation Rate' },
            ].map((stat, i) => (
              <div key={i} className="text-white">
                <p className="text-3xl sm:text-4xl font-bold mb-1">{stat.value}</p>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
