import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-blue-600 shadow"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <article className="rounded-3xl bg-white p-6 shadow sm:p-10">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100"><FileText className="h-6 w-6 text-purple-700" /></div>
            <div><h1 className="text-3xl font-black text-gray-900">Terms & Conditions</h1><p className="text-sm text-gray-500">Last updated: 1 November 2026</p></div>
          </div>
          <div className="space-y-6 leading-7 text-gray-600">
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">1. Acceptance</h2><p>By accessing or using SchoolConnect, you agree to these terms. If you use the platform for a school or organisation, you confirm that you are authorised to act for it.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">2. Platform purpose</h2><p>SchoolConnect provides online tools for participating schools to publish school information, notices, events and other permitted content, and to manage authorised school-related accounts and records. Features may vary by account role and subscription status.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">3. Accounts and security</h2><p>Users must provide accurate account information, keep login credentials secure and promptly report suspected unauthorised access. Users must not share accounts or attempt to bypass access controls.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">4. School content and responsibility</h2><p>Schools and their authorised administrators are responsible for the accuracy, legality and appropriateness of information they upload or publish, including school details, staff profiles, notices, events, images and student-related information. They must have the rights and permissions needed to publish that content and must obtain any required parental or guardian consent before publishing identifiable information about children.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">5. Acceptable use</h2><p>You must not use the platform to publish unlawful, misleading, infringing, abusive or harmful material; impersonate another person; distribute malware; interfere with platform operation; scrape or harvest personal information; or access another school's records without authorisation.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">6. Payments and subscriptions</h2><p>Where a paid plan or recharge is offered, the applicable price, duration and payment instructions are shown in the relevant payment flow. A payment is not treated as activated until it has been verified and the platform reflects the applicable status. Refund and cancellation requests are handled under the separate Refund & Cancellation Policy and any terms shown before payment.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">7. Availability and changes</h2><p>We work to keep the platform available, but uninterrupted access cannot be guaranteed. Maintenance, security events, provider outages or updates may temporarily affect features. We may modify or discontinue features where reasonably necessary.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">8. Third-party services and advertising</h2><p>The platform may rely on third-party services such as Firebase, Vercel and Google AdSense. Their services are subject to their own terms. Advertising, where enabled and approved, is provided by third parties; users must not click ads to generate artificial activity or encourage invalid traffic.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">9. Suspension</h2><p>Access may be restricted or suspended where an account violates these terms, creates a security risk, or uses the service unlawfully. Where practical, the responsible account holder will be informed.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">10. Contact and updates</h2><p>Questions about these terms may be sent to <a className="font-semibold text-blue-700 underline" href="mailto:zaradigitalseva@gmail.com">zaradigitalseva@gmail.com</a>. We may update these terms and publish the current version on this page.</p></section>
          </div>
        </article>
      </div>
    </div>
  );
}
