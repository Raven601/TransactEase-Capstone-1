import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode } from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

const TransactionsList = ({ transactions }) => {
  return (
    <div className="overflow-hidden rounded-[20px] border border-[#f0d9a7] bg-[#fffdf8]">
      <div className="overflow-x-auto">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Items</th>
              <th>Payment</th>
              <th>Total</th>
              <th>QR</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <div>
                    <p className="font-semibold text-[#6b241d]">#{transaction.id.slice(0, 6).toUpperCase()}</p>
                    <p className="text-sm text-[#8a5a2b]">Latest POS transaction</p>
                  </div>
                </td>
                <td>{transaction.items?.length || 0} item(s)</td>
                <td className="capitalize">{transaction.paymentMethod || 'cash'}</td>
                <td className="font-semibold">{formatCurrency(transaction.totalAmount || 0)}</td>
                <td>
                  {transaction.qrToken ? (
                    <Link
                      to={`/qr-receipt/${transaction.id}?token=${encodeURIComponent(transaction.qrToken)}`}
                      className="action-button action-button-edit"
                    >
                      <QrCode className="mr-1 h-3.5 w-3.5" />
                      View
                    </Link>
                  ) : (
                    <span className="text-sm text-[#8a5a2b]">Legacy</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionsList;
