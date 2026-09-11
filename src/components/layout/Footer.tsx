import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
} from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="block text-base font-bold text-white leading-tight">
                  Bright Future
                </span>
                <span className="block text-xs text-blue-400 leading-tight">
                  Academy
                </span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Nurturing young minds, building bright futures. A place where
              excellence meets opportunity.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link to="/academics" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Academics</Link></li>
              <li><Link to="/teachers" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Our Teachers</Link></li>
              <li><Link to="/notices" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Notices</Link></li>
              <li><Link to="/events" className="text-sm text-gray-400 hover:text-blue-400 transition-colors">Events</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Contact
            </h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-gray-400">
                <MapPin className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                123 Education Lane, Knowledge City
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                (555) 123-4567
              </li>
              <li className="flex items-center gap-2.5 text-sm text-gray-400">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                info@brightfuture.edu
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Follow Us
            </h4>
            <div className="flex gap-3">
              {[Facebook, Twitter, Youtube, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-gray-800 flex items-center justify-center hover:bg-blue-600 transition-colors"
                >
                  <Icon className="w-4 h-4 text-gray-300" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Bright Future Academy. All rights reserved.
          </p>
          <p className="text-xs text-gray-500">
            Built with care for our students.
          </p>
        </div>
      </div>
    </footer>
  );
}
