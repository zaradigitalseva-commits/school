import { Link } from 'react-router-dom';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

export default function RefundCancellationPage() {
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
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <RefreshCcw className="w-6 h-6 text-amber-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Refund & Cancellation Policy
            </h1>
          </div>

          <div className="space-y-6 text-gray-600 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                1. Current Payment Status
              </h2>
              <p>
                At present, this website does not provide a Razorpay Pay Now
                payment facility. Therefore, no online payment or automatic
                refund process is currently offered through this website.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                2. Future Payments
              </h2>
              <p>
                If online payment services are introduced in the future, the
                applicable payment, cancellation and refund conditions will be
                clearly displayed before payment is made.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                3. Cancellation
              </h2>
              <p>
                Any cancellation terms applicable to a future service or
                subscription will be communicated clearly before the user
                confirms the transaction.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                4. Refund Requests
              </h2>
              <p>
                If a paid service is introduced later, eligible refund
                requests will be handled according to the refund conditions
                applicable to that particular service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                5. Contact
              </h2>
              <p>
                For any cancellation or refund-related question, please
                contact us using the Contact Us page.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                6. Policy Changes
              </h2>
              <p>
                This policy may be updated when website services or payment
                facilities change.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
