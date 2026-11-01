import { Link } from 'react-router-dom';
import { GraduationCap, Mail, ShieldCheck } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-700">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="font-extrabold text-white">SchoolConnect</p>
                <p className="text-xs text-blue-300">Multi-School Platform</p>
              </div>
            </div>
            <p className="max-w-sm text-sm leading-6 text-gray-400">
              A platform that helps schools share public information and manage school-related activities through dedicated accounts.
            </p>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Explore</h2>
            <ul className="grid grid-cols-2 gap-3 text-sm">
              <li><Link to="/" className="hover:text-white">Home</Link></li>
              <li><Link to="/about" className="hover:text-white">About</Link></li>
              <li><Link to="/schools" className="hover:text-white">Schools</Link></li>
              <li><Link to="/academics" className="hover:text-white">Platform Features</Link></li>
              <li><Link to="/notices" className="hover:text-white">Notices</Link></li>
              <li><Link to="/events" className="hover:text-white">Events</Link></li>
              <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-white">Policies & Support</h2>
            <ul className="space-y-3 text-sm">
              <li><Link to="/privacy-policy" className="hover:text-white">Privacy Policy</Link></li>
              <li><Link to="/terms-conditions" className="hover:text-white">Terms & Conditions</Link></li>
              <li><Link to="/refund-cancellation" className="hover:text-white">Refund & Cancellation</Link></li>
              <li>
                <a href="mailto:zaradigitalseva@gmail.com" className="inline-flex items-center gap-2 break-all hover:text-white">
                  <Mail className="h-4 w-4 shrink-0" /> zaradigitalseva@gmail.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-gray-800 pt-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SchoolConnect. All rights reserved.</p>
          <p className="inline-flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> School information is published by participating schools.</p>
        </div>
      </div>
    </footer>
  );
}
