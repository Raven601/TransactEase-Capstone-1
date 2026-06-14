import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock, CreditCard, MapPin, Phone, Printer, ShieldAlert, User } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { formatCurrency } from '../utils/helpers';

const QRReceiptPage = () => {
  const { transactionId } = useParams();
  const [searchParams] = useSearchParams();
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    transactionService
      .getTransactionByQr({ transactionId, token: searchParams.get('token') })
      .then(setTransaction)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [searchParams, transactionId]);

  const formattedDate = transaction?.timestamp
    ? new Date(
        transaction.timestamp.seconds
          ? transaction.timestamp.seconds * 1000
          : transaction.timestamp,
      ).toLocaleString('en-PH', { dateStyle: 'full', timeStyle: 'short' })
    : null;

  const receiptNumber = transaction?.id
    ? `#${transaction.id.slice(0, 8).toUpperCase()}`
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbeb] via-[#fef9c3] to-[#fef3c7] print:bg-white">
      <div className="mx-auto max-w-lg px-4 py-10 print:py-4">

        {/* Brand header */}
        <div className="mb-6 text-center">
          <div className="inline-block">
            <img
              src="/wimpys-logo.png"
              alt="Wimpy's"
              className="mx-auto h-20 object-contain drop-shadow-sm"
            />
          </div>
          <p className="mt-3 text-base font-extrabold text-[#5f1717]">
            Olongapo Wimpy's Food Plaza &amp; Pub House
          </p>
          <div className="mt-1 flex flex-col items-center gap-0.5 text-xs text-[#a16207]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              No. 34 Magsaysay Drive, Olongapo City, 2200
            </span>
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3 flex-shrink-0" />
              (047) 222-3213
            </span>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-[#a16207]">
            Official Customer Receipt
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-[#fde68a] bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-[#fde68a] border-t-[#dc2626]" />
            <p className="mt-4 font-semibold text-[#a16207]">Loading your receipt…</p>
          </div>
        )}

        {!loading && error && (
          <div className="rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm">
            <ShieldAlert className="mx-auto h-14 w-14 text-red-500" />
            <h2 className="mt-4 text-lg font-bold text-red-700">Receipt not found</h2>
            <p className="mt-2 text-sm text-[#a16207]">{error}</p>
            <p className="mt-4 text-xs text-[#a16207]">
              Please ask the cashier to reprint your QR receipt.
            </p>
          </div>
        )}

        {!loading && transaction && (
          <div className="overflow-hidden rounded-3xl border border-[#fde68a] bg-white shadow-sm">
            {/* Status banner */}
            <div className="bg-emerald-50 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-emerald-100 p-2">
                  <CheckCircle2 className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="font-bold text-emerald-800">Payment Confirmed</p>
                  <p className="text-sm text-emerald-700">Receipt {receiptNumber}</p>
                </div>
                <span className="ml-auto inline-flex rounded-full bg-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  {transaction.paymentStatus || 'Paid'}
                </span>
              </div>
            </div>

            {/* Date & staff */}
            <div className="border-b border-[#fde68a] px-6 py-4">
              {formattedDate && (
                <div className="flex items-center gap-2 text-sm text-[#a16207]">
                  <Clock className="h-4 w-4 flex-shrink-0" />
                  {formattedDate}
                </div>
              )}
              {transaction.staffEmail && (
                <div className="mt-1 flex items-center gap-2 text-xs text-[#a16207]">
                  <User className="h-3.5 w-3.5 flex-shrink-0" />
                  Served by {transaction.staffEmail}
                </div>
              )}
            </div>

            {/* Items */}
            <div className="px-6 py-5">
              <h3 className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-[#a16207]">
                Items Ordered
              </h3>
              <div className="space-y-2">
                {transaction.items?.map((item, i) => (
                  <div
                    key={`${item.productId || item.id}-${i}`}
                    className="flex items-center justify-between rounded-xl bg-[#fefce8] px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-[#5f1717]">{item.name}</p>
                      <p className="text-xs text-[#a16207]">×{item.quantity} @ {formatCurrency(item.price)}</p>
                    </div>
                    <p className="font-bold text-[#6b241d]">
                      {formatCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-[#fde68a] px-6 py-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-[#a16207]">
                  <span>Subtotal</span>
                  <span className="font-semibold">
                    {formatCurrency(transaction.subtotal || transaction.totalAmount)}
                  </span>
                </div>
                {transaction.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>{transaction.discountType || 'Discount'}</span>
                    <span>−{formatCurrency(transaction.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-[#fde68a] pt-2 text-lg font-extrabold text-[#dc2626]">
                  <span>Total Paid</span>
                  <span>{formatCurrency(transaction.totalAmount)}</span>
                </div>
                {transaction.cashAmount > 0 && transaction.paymentMethod === 'cash' && (
                  <>
                    <div className="flex justify-between text-[#a16207]">
                      <span>Cash Tendered</span>
                      <span className="font-semibold">{formatCurrency(transaction.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-emerald-700">
                      <span>Change</span>
                      <span>{formatCurrency(transaction.change || 0)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center gap-2 rounded-xl bg-[#fefce8] px-4 py-3 text-sm text-[#a16207]">
                <CreditCard className="h-4 w-4 flex-shrink-0 text-[#dc2626]" />
                <span>
                  Paid via{' '}
                  <strong className="capitalize text-[#6b241d]">
                    {transaction.paymentMethod || 'cash'}
                  </strong>
                  {transaction.paymentStatus === 'Paid' && ' · Confirmed'}
                </span>
              </div>
            </div>

            {/* Print */}
            <div className="border-t border-[#fde68a] px-6 py-4 text-center print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="btn-secondary inline-flex items-center gap-2 px-6 py-2.5 text-sm"
              >
                <Printer className="h-4 w-4" />
                Print Receipt
              </button>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-[#a16207]">
          Thank you for dining at Wimpy's! · Powered by TransactEase
        </p>
      </div>
    </div>
  );
};

export default QRReceiptPage;
