import React, { useEffect, useState } from 'react';
import { Plus, QrCode, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { generateQrDataUrl } from '../../services/qrService';
import { formatCurrency } from '../../utils/helpers';

const QRReceiptModal = ({ transaction, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    let isMounted = true;
    generateQrDataUrl(transaction.qrPayload)
      .then((dataUrl) => {
        if (isMounted) setQrDataUrl(dataUrl);
      })
      .catch(() => toast.error('Unable to generate QR receipt.'));
    return () => { isMounted = false; };
  }, [transaction.qrPayload]);

  const timestamp = transaction.timestamp
    ? (transaction.timestamp.seconds
        ? new Date(transaction.timestamp.seconds * 1000)
        : new Date(transaction.timestamp)
      ).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-xl rounded-3xl border border-[#f0d9a7] bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#f0d9a7] px-6 py-5">
          <div>
            <p className="app-eyebrow">Receipt & QR Code</p>
            <h3 className="mt-1 text-xl font-extrabold text-[#4f1717]">Payment confirmed</h3>
            <p className="mt-0.5 text-sm text-[#8a5a2b]">
              Show or hand the QR code to the customer to track their order.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#a16207] transition hover:bg-[#fef9c3]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid gap-5 md:grid-cols-[200px_minmax(0,1fr)]">
            <div className="qr-frame">
              <div className="qr-scan-line" />
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Transaction QR receipt"
                  className="h-full w-full rounded-xl object-contain"
                />
              ) : (
                <QrCode className="h-16 w-16 animate-pulse text-[#dc2626]" />
              )}
            </div>

            <div className="space-y-3">
              <div className="pos-surface p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a16207]">Order #</p>
                <p className="mt-1 text-xl font-bold text-[#6b241d]">
                  #{transaction.id.slice(0, 8).toUpperCase()}
                </p>
                {timestamp && (
                  <p className="mt-0.5 text-xs text-[#a16207]">{timestamp}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="pos-surface p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a16207]">Status</p>
                  <p className="mt-1 font-semibold text-emerald-700">{transaction.orderStatus}</p>
                </div>
                <div className="pos-surface p-3">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a16207]">Payment</p>
                  <p className="mt-1 font-semibold capitalize text-emerald-700">
                    {transaction.paymentStatus}
                  </p>
                </div>
              </div>
              <div className="pos-surface p-3">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a16207]">Total Paid</p>
                <p className="mt-1 text-2xl font-bold text-[#8f171b]">
                  {formatCurrency(transaction.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2 py-3 text-base font-extrabold"
          >
            <Plus className="h-5 w-5" />
            New Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRReceiptModal;
