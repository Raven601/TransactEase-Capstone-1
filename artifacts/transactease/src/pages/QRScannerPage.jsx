import React, { useEffect, useRef, useState } from 'react';
import { Camera, CheckCircle2, ScanLine, QrCode, Search, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';
import AppShell from '../components/Common/AppShell';
import { transactionService } from '../services/transactionService';
import { auditLogService, AUDIT_ACTIONS } from '../services/auditLogService';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/helpers';

const SCANNER_ELEMENT_ID = 'transactease-qr-scanner';

const QRScannerPage = () => {
  const { currentUser, userRole } = useAuth();
  const scannerRef = useRef(null);
  const [manualValue, setManualValue] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [validating, setValidating] = useState(false);

  const validateQrValue = async (value) => {
    setValidating(true);
    try {
      const transaction = await transactionService.validateQrUrl(value);
      setScanResult(transaction);
      setScanHistory((currentHistory) => [
        {
          id: transaction.id,
          status: 'Valid',
          totalAmount: transaction.totalAmount,
          scannedAt: new Date().toLocaleTimeString(),
        },
        ...currentHistory,
      ].slice(0, 5));
      auditLogService.log({
        action: AUDIT_ACTIONS.QR_SCANNED,
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userRole: userRole || null,
        details: { transactionId: transaction.id, status: 'valid', totalAmount: transaction.totalAmount },
      });
      toast.success('QR receipt validated.');
      return transaction;
    } catch (error) {
      setScanHistory((currentHistory) => [
        {
          id: 'Invalid QR',
          status: 'Error',
          totalAmount: 0,
          scannedAt: new Date().toLocaleTimeString(),
        },
        ...currentHistory,
      ].slice(0, 5));
      auditLogService.log({
        action: AUDIT_ACTIONS.QR_SCANNED,
        userId: currentUser?.uid || null,
        userEmail: currentUser?.email || null,
        userRole: userRole || null,
        details: { status: 'invalid', error: error.message },
      });
      toast.error(error.message);
      throw error;
    } finally {
      setValidating(false);
    }
  };

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      SCANNER_ELEMENT_ID,
      {
        fps: 10,
        qrbox: { width: 240, height: 240 },
        rememberLastUsedCamera: true,
      },
      false
    );

    scanner.render(
      async (decodedText) => {
        await scanner.clear();
        await validateQrValue(decodedText);
      },
      () => {}
    );

    scannerRef.current = scanner;

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, []);

  const handleManualSubmit = async (event) => {
    event.preventDefault();
    if (!manualValue.trim()) {
      toast.error('Paste a QR receipt URL first.');
      return;
    }

    await validateQrValue(manualValue.trim());
  };

  return (
    <AppShell
      eyebrow="QR Validation"
      title="QR Code Scanner"
      subtitle="Use a webcam or phone camera to validate receipts and pull up transaction details instantly."
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <article className="section-card p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-100 p-3 text-[#c62828]">
              <Camera className="h-6 w-6" />
            </div>
            <div>
              <h2 className="pos-section-title">Webcam Scanner</h2>
              <p className="pos-section-copy">Allow camera access, place the receipt QR inside the guide, and wait for validation.</p>
            </div>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#fff3e0] px-3 py-2 text-xs font-extrabold uppercase tracking-[0.14em] text-[#9a3412]">
              <ScanLine className="h-4 w-4" />
              Secure Scan
            </div>
          </div>

          <div className="qr-scanner-shell mt-6">
            <div className="qr-scanner-overlay" />
            <div className="qr-scan-line" />
            <div id={SCANNER_ELEMENT_ID} />
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {['Open camera access', 'Center receipt QR', 'Wait for validation'].map((step, index) => (
              <div key={step} className="rounded-2xl border border-[#f0d9a7] bg-[#fff8f0] px-4 py-3 text-sm font-bold text-[#6b241d]">
                <span className="mr-2 text-[#c62828]">0{index + 1}</span>
                {step}
              </div>
            ))}
          </div>

          <form onSubmit={handleManualSubmit} className="mt-5 flex flex-col gap-3 md:flex-row">
            <input
              value={manualValue}
              onChange={(event) => setManualValue(event.target.value)}
              className="admin-input"
              placeholder="Paste QR receipt URL for manual validation"
            />
            <button type="submit" disabled={validating} className="btn-primary inline-flex items-center justify-center gap-2 px-5 py-3">
              <Search className="h-4 w-4" />
              Validate
            </button>
          </form>
        </article>

        <article className="section-card overflow-hidden">
          <div className="border-b border-[#f0d9a7] px-6 py-5">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-emerald-600" />
              <div>
                <h2 className="pos-section-title">Validation Result</h2>
                <p className="pos-section-copy">Only receipts with a matching transaction token are accepted.</p>
              </div>
            </div>
          </div>

          {scanResult ? (
            <div className="space-y-4 p-6">
              <div className="rounded-xl bg-emerald-50 p-4 text-emerald-700">
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="h-5 w-5" />
                  Valid TransactEase receipt
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="pos-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Order</p>
                  <p className="mt-1 font-bold text-[#6b241d]">#{scanResult.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="pos-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Total</p>
                  <p className="mt-1 font-bold text-[#8f171b]">{formatCurrency(scanResult.totalAmount)}</p>
                </div>
              </div>

              <div className="pos-surface p-4">
                <p className="font-semibold text-[#6b241d]">Items</p>
                <div className="mt-3 space-y-2">
                  {scanResult.items?.map((item) => (
                    <div key={`${item.productId || item.id}-${item.name}`} className="flex justify-between gap-3 text-sm text-[#8a5a2b]">
                      <span>{item.quantity} x {item.name}</span>
                      <span className="font-semibold">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="pos-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Order Status</p>
                  <p className="mt-1 font-semibold text-emerald-700">{scanResult.orderStatus}</p>
                </div>
                <div className="pos-surface p-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a5a2b]">Payment</p>
                  <p className="mt-1 font-semibold text-emerald-700">{scanResult.paymentStatus}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center text-[#8a5a2b]">
              <QrCode className="h-16 w-16 text-[#d62828]" />
              <p className="mt-4 font-semibold text-[#6b241d]">No receipt scanned yet</p>
              <p className="mt-2 text-sm">The validated order summary appears here after scanning.</p>
            </div>
          )}
        </article>
      </section>

      <section className="admin-chart-card">
        <div className="admin-card-header">
          <div>
            <h2 className="pos-section-title">Scan History</h2>
            <p className="pos-section-copy">Recent validation attempts for receipt audit review.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {scanHistory.length === 0 ? (
            <p className="rounded-2xl bg-[#fff8f0] p-4 text-sm font-semibold text-[#8a5a2b]">No scan attempts yet.</p>
          ) : (
            scanHistory.map((item, index) => (
              <div key={`${item.id}-${index}`} className="rounded-2xl border border-[#f0d9a7] bg-white p-4 shadow-sm">
                <p className="truncate font-bold text-[#4f1717]">{item.id}</p>
                <p className={`mt-2 text-sm font-extrabold ${item.status === 'Valid' ? 'text-emerald-600' : 'text-red-600'}`}>
                  {item.status}
                </p>
                <p className="mt-1 text-xs text-[#8a5a2b]">{item.scannedAt}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </AppShell>
  );
};

export default QRScannerPage;
