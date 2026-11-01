import { Link } from 'react-router-dom';
import { RefreshCcw, ArrowLeft } from 'lucide-react';

export default function RefundCancellationPage() {
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="mb-6 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 font-semibold text-blue-600 shadow"><ArrowLeft className="h-4 w-4" /> Home</Link>
        <article className="rounded-3xl bg-white p-6 shadow sm:p-10">
          <div className="mb-7 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100"><RefreshCcw className="h-6 w-6 text-amber-700" /></div>
            <div><h1 className="text-3xl font-black text-gray-900">Refund & Cancellation Policy</h1><p className="text-sm text-gray-500">Last updated: 1 November 2026</p></div>
          </div>
          <div className="space-y-6 leading-7 text-gray-600">
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">1. Plans and payments</h2><p>SchoolConnect may offer paid school registration, subscription or recharge plans. The plan price, duration, payment method and any applicable conditions are displayed in the relevant payment flow before the user submits payment. Please review those details carefully before paying.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">2. Payment verification</h2><p>Where a payment requires manual verification, submitting a transaction reference or payment proof does not by itself mean that the plan has been activated. Activation takes place after the payment is checked and the account status is updated.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">3. Cancellation</h2><p>Before making a payment, contact the platform team if you are unsure about the plan or need clarification. Once a plan has been activated or service access has been provided, cancellation may be limited and will be assessed based on the service status and applicable law.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">4. Refund requests</h2><p>If you believe you were charged incorrectly, paid more than once, or your payment was not credited after successful verification, contact us with the registered account email, transaction date, amount and transaction reference. Do not send passwords, card details or other confidential credentials. Each request will be reviewed and handled in accordance with applicable law and the terms displayed at purchase.</p></section>
            <section><h2 className="mb-2 text-xl font-bold text-gray-900">5. Contact</h2><p>For payment, cancellation or refund questions, email <a className="font-semibold text-blue-700 underline" href="mailto:zaradigitalseva@gmail.com">zaradigitalseva@gmail.com</a>.</p></section>
          </div>
        </article>
      </div>
    </div>
  );
}
