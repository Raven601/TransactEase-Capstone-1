const escapeCell = (value) => {
  const str = value === null || value === undefined ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

const toRow = (cells) => cells.map(escapeCell).join(',');

const tsToDate = (ts) => {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  if (ts?.seconds) return new Date(ts.seconds * 1000);
  return new Date(ts);
};

export const buildSalesReportCsv = (transactions) => {
  const headers = [
    'Order #',
    'Date',
    'Time',
    'Items',
    'Subtotal (₱)',
    'Discount (₱)',
    'Total (₱)',
    'Payment Method',
    'Order Status',
    'Payment Status',
  ];

  const rows = transactions.map((t, i) => {
    const date = tsToDate(t.timestamp);
    const dateStr = date ? date.toLocaleDateString('en-PH') : '';
    const timeStr = date ? date.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : '';

    const items = (t.items || [])
      .map((item) => `${item.quantity}x ${item.name}`)
      .join('; ');

    return toRow([
      t.id ? t.id.slice(0, 8).toUpperCase() : String(i + 1),
      dateStr,
      timeStr,
      items,
      (t.subtotal ?? t.totalAmount ?? 0).toFixed(2),
      (t.discount ?? t.discountAmount ?? 0).toFixed(2),
      (t.totalAmount ?? 0).toFixed(2),
      t.paymentMethod || 'Cash',
      t.orderStatus || 'Completed',
      t.paymentStatus || 'Paid',
    ]);
  });

  return [toRow(headers), ...rows].join('\n');
};

export const downloadCsv = (csvString, filename) => {
  const blob = new Blob(['\uFEFF' + csvString], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const buildExportFilename = (label) => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return `wimpy-sales-${label}-${date}.csv`;
};
