import { Link } from 'react-router-dom';
import { FileText, ArrowLeft } from 'lucide-react';

export default function TermsConditionsPage() {
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
            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Terms & Conditions
            </h1>
          </div>

          <div className="space-y-6 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                1. Acceptance of Terms
              </h2>
              <p>
                By accessing or using this website, you agree to follow these
                Terms & Conditions and all applicable laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                2. Website Use
              </h2>
              <p>
                The website is provided for legitimate school, educational,
                informational and administrative purposes. Users must not
                misuse the website or attempt to gain unauthorized access.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                3. User Accounts
              </h2>
              <p>
                Users are responsible for maintaining the security of their
                account and for activities performed through their account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                4. School Information
              </h2>
              <p>
                School administrators are responsible for ensuring that the
                information they publish through the website is accurate and
                appropriate.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                5. Intellectual Property
              </h2>
              <p>
                Website design, software, logos, text and other protected
                materials may not be copied, reproduced or redistributed
                without appropriate authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                6. Availability
              </h2>
              <p>
                We may update, modify, suspend or temporarily restrict parts
                of the website when necessary for maintenance, security or
                technical reasons.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                7. Prohibited Activities
              </h2>
              <p>
                Users must not upload unlawful, harmful, misleading,
                fraudulent, abusive or unauthorized content.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                8. Changes to Terms
              </h2>
              <p>
                These Terms & Conditions may be updated from time to time.
                Continued use of the website after changes means that the
                updated terms apply.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                9. Contact
              </h2>
              <p>
                For questions regarding these terms, please contact us through
                the Contact Us page.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
