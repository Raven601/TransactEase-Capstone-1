import QRCode from 'qrcode';

const QR_TOKEN_PREFIX = 'te';

export const createQrToken = () => {
  if (window.crypto?.randomUUID) {
    return `${QR_TOKEN_PREFIX}_${window.crypto.randomUUID()}`;
  }

  const randomPart = Math.random().toString(36).slice(2);
  return `${QR_TOKEN_PREFIX}_${Date.now()}_${randomPart}`;
};

export const createReceiptQrValue = (transactionId, qrToken) => {
  const receiptUrl = new URL(`/qr-receipt/${transactionId}`, window.location.origin);
  receiptUrl.searchParams.set('token', qrToken);
  return receiptUrl.toString();
};

export const generateQrDataUrl = async (value) => {
  return QRCode.toDataURL(value, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 280,
    color: {
      dark: '#6b241d',
      light: '#fffdf8',
    },
  });
};

export const downloadDataUrl = (dataUrl, filename) => {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
};
