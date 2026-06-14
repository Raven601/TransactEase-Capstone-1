import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Banknote, CreditCard, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { transactionService } from '../../services/transactionService';
import { formatCurrency } from '../../utils/helpers';
import QRReceiptModal from './QRReceiptModal';

const CheckoutModal = ({ onClose }) => {
  const { currentUser, userRole } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState('');
  const [processing, setProcessing] = useState(false);
  const [completedTransaction, setCompletedTransaction] = useState(null);

  const {
    items,
    discount,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    clearCart,
  } = useCart();

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotal();
  const change = paymentMethod === 'cash' ? parseFloat(cashAmount || 0) - total : 0;

  const handleCheckout = async () => {
    if (paymentMethod === 'cash') {
      const cash = parseFloat(cashAmount || 0);
      if (cash < total) {
        toast.error('Insufficient cash amount');
        return;
      }
    }

    setProcessing(true);
    try {
      const transactionData = {
        items: items.map((item) => ({
          id: item.id ?? null,
          productId: item.productId || item.id || null,
          name: item.name ?? '',
          price: item.price ?? 0,
          quantity: item.quantity ?? 1,
          category: item.category ?? null,
          sku: item.sku ?? null,
          selectedVariant: item.selectedVariant ?? null,
          stockQuantity: item.stockQuantity ?? null,
          minimumStockThreshold: item.minimumStockThreshold ?? null,
        })),
        subtotal: subtotal ?? 0,
        discountType: discount?.type ?? null,
        discountPercentage: discount?.percentage ?? 0,
        discountAmount: discountAmount ?? 0,
        totalAmount: total ?? 0,
        paymentMethod: paymentMethod ?? 'cash',
        cashAmount: paymentMethod === 'cash' ? (parseFloat(cashAmount) || 0) : total,
        change: paymentMethod === 'cash' ? (change || 0) : 0,
        staffId: currentUser?.uid ?? null,
        staffEmail: currentUser?.email ?? null,
        cashierId: currentUser?.uid ?? null,
        cashierEmail: currentUser?.email ?? null,
        cashierRole: userRole ?? null,
      };

      const result = await transactionService.createTransactionWithInventory(transactionData);

      toast.success('Transaction completed successfully!');
      result.lowStockItems?.forEach((product) => {
        toast((toastInstance) => (
          <div className="space-y-1">
            <p className="font-semibold text-slate-900">{product.name} is low on stock.</p>
            <p className="text-sm text-slate-600">
              Suggested reorder: {product.suggestedRestockQuantity} items
            </p>
            <button
              onClick={() => toast.dismiss(toastInstance.id)}
              className="text-xs font-semibold text-red-600"
            >
              Dismiss
            </button>
          </div>
        ));
      });

      clearCart();
      setCompletedTransaction(result.transaction);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessing(false);
    }
  };

  if (completedTransaction) {
    return (
      <QRReceiptModal
        transaction={completedTransaction}
        onClose={onClose}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-3xl border border-[#f0d9a7] bg-white shadow-2xl flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-[#fde68a] flex-shrink-0">
          <h3 className="text-lg font-extrabold text-[#7a1f1f]">Checkout</h3>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#a16207] transition-colors hover:bg-[#fefce8]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Order Summary */}
          <div className="rounded-2xl border border-[#fde68a] bg-[#fefce8] p-4">
            <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#a16207]">Order Summary</h4>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-[#a16207]">
                <span>Subtotal</span>
                <span className="font-semibold text-[#6b241d]">{formatCurrency(subtotal)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-emerald-600">
                  <span>{discount.type} ({discount.percentage}% off)</span>
                  <span className="font-semibold">−{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#fde68a] pt-2 text-lg font-extrabold text-[#8f171b]">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#a16207]">Payment Method</h4>
            <div className="flex items-center gap-3 rounded-2xl border border-[#dc2626] bg-red-50 p-4">
              <Banknote className="h-5 w-5 text-[#b71c1c]" />
              <span className="font-extrabold text-[#6b241d]">Cash</span>
            </div>
          </div>

          {/* Cash input */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="mb-2 block text-sm font-extrabold uppercase tracking-wider text-[#a16207]">
                Cash Amount
              </label>
              <input
                type="number"
                step="0.01"
                min={total}
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="login-input"
                placeholder={`Minimum: ${formatCurrency(total)}`}
              />
              {change > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-3">
                  <span className="text-sm font-semibold text-emerald-700">Change</span>
                  <span className="text-base font-extrabold text-emerald-700">{formatCurrency(change)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex gap-3 px-6 py-5 border-t border-[#fde68a] flex-shrink-0">
          <button onClick={onClose} className="flex-1 btn-secondary py-3" disabled={processing}>
            Cancel
          </button>
          <button onClick={handleCheckout} disabled={processing} className="flex-1 btn-primary py-3">
            {processing ? 'Processing…' : 'Complete Payment'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
