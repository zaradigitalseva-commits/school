import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-blue-600 shadow">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <article className="rounded-3xl bg-white p-6 shadow sm:p-10">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"><ShieldCheck className="h-6 w-6 text-blue-700" /></div>
            <div>
              <h1 className="text-3xl font-black text-gray-900">Privacy Policy</h1>
              <p className="text-sm text-gray-500">Last updated: 1 November 2026</p>
            </div>
          </div>

          <div className="space-y-6 leading-7 text-gray-600">
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">1. About this policy</h2>
              <p>SchoolConnect is a multi-school platform. This policy explains how information may be handled when visitors browse the public website and when authorised schools, administrators, teachers or other users use platform features.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">2. Information that may be processed</h2>
              <p>Depending on the features used, information may include account identifiers and email addresses, school profile and contact details, announcements, events, teacher and staff profile information, student-related records entered by a school, payment or subscription reference details, and information a visitor chooses to send through the contact link. Technical information such as browser, device, log and security data may also be processed by the hosting or service providers.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">3. How information is used</h2>
              <p>Information is used to provide platform functions, authenticate accounts, display school-published information, support school administration, process and verify service payments where applicable, respond to enquiries, maintain security and comply with applicable obligations. We do not offer student information for sale.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">4. School and children's information</h2>
              <p>Schools and their authorised administrators are responsible for deciding what student information they enter and for obtaining any notices, permissions or parental/guardian consents required by applicable law. Children should not independently create accounts or submit sensitive information unless the school and parent/guardian have authorised the process. Access to school records is intended for authorised users and is governed by account roles and platform permissions.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">5. Service providers</h2>
              <p>The platform uses Google Firebase services for functions such as authentication and database hosting. Website hosting is provided by Vercel. These providers may process technical or account information as needed to deliver their services, subject to their own terms and privacy policies.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">6. Advertising and cookies</h2>
              <p>This website uses Google AdSense advertising technology. Google and its partners may use cookies or similar technologies to store or access information on a visitor's browser, measure advertising, limit repeated ads and, where permitted by the visitor's settings and applicable law, personalise ads. Google may process information such as browser identifiers, device information, approximate location derived from IP address and ad interactions. The Google advertising cookie information is available in Google's advertising and privacy documentation.</p>
              <p className="mt-3">Visitors can review or change Google's advertising personalisation settings at <a className="font-semibold text-blue-700 underline" href="https://adssettings.google.com/" target="_blank" rel="noreferrer">Google Ads Settings</a>. Cookie controls available in the browser can also be used to manage or delete cookies; blocking cookies may affect some website or advertising functions. The presence of the AdSense code does not mean ads are currently being served or that Google has approved the site.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">7. Sharing and disclosure</h2>
              <p>Information may be processed by the service providers described above, shared with the school that manages the relevant school records, or disclosed where required to protect users, enforce platform terms or comply with law. We do not sell personal information to third parties.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">8. Security and retention</h2>
              <p>Reasonable technical and organisational measures are used to protect information. No online service can guarantee absolute security. Information is retained for as long as needed for the relevant platform function, school relationship, security purpose or legal requirement, and may be deleted or corrected through the responsible school or platform administrator where appropriate.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">9. Your choices and requests</h2>
              <p>For school records, contact the relevant school administrator first. For platform account, privacy or website questions, contact <a className="font-semibold text-blue-700 underline" href="mailto:zaradigitalseva@gmail.com">zaradigitalseva@gmail.com</a>. Please do not include passwords or sensitive student records in an ordinary email.</p>
            </section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">10. Changes</h2>
              <p>This policy may be updated when the platform, service providers or legal requirements change. The latest version and update date will be published on this page.</p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
