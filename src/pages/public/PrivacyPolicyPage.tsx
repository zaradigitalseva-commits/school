import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          to="/"
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white text-blue-600 font-semibold btn-3d"
        >
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 card-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Privacy Policy
              </h1>
              <p className="text-sm text-gray-500">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-6 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                1. Introduction
              </h2>
              <p>
                We respect your privacy and are committed to protecting
                personal information provided through this website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                2. Information We Collect
              </h2>
              <p>
                Depending on the features you use, we may collect information
                such as your name, email address, phone number, school
                information and other information that you voluntarily provide.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                3. How We Use Information
              </h2>
              <p>
                Information may be used to provide and improve website
                services, communicate with users, manage accounts and maintain
                website security.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                4. Google Login
              </h2>
              <p>
                If Google Login is available, authentication may be handled
                through Google's authentication services. We only use the
                information necessary to provide the requested service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                5. Data Security
              </h2>
              <p>
                We take reasonable technical and organizational measures to
                protect information against unauthorized access, alteration,
                disclosure or destruction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                6. Third-Party Services
              </h2>
              <p>
                The website may use third-party services such as Firebase,
                Google authentication, hosting or analytics services. Their
                own privacy policies may also apply.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                7. Children's Privacy
              </h2>
              <p>
                Users should not submit personal information belonging to
                children through the website without appropriate parental or
                school authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                8. Contact
              </h2>
              <p>
                If you have questions about this Privacy Policy, please use
                our Contact Us page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                9. Policy Updates
              </h2>
              <p>
                This Privacy Policy may be updated from time to time. Any
                updated version will be published on this page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
