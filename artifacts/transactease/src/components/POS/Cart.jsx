import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BadgePercent, Clock3, Minus, Plus, Receipt, ShoppingCart, Trash2, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency } from '../../utils/helpers';
import CheckoutModal from './CheckoutModal';
import DiscountModal from './DiscountModal';

const Cart = ({ onOrderComplete }) => {
  const {
    items,
    discount,
    removeFromCart,
    updateQuantity,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal,
  } = useCart();

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const subtotal = getSubtotal();
  const discountAmount = getDiscountAmount();
  const total = getTotal();

  const getProductCartQuantity = (productId) =>
    items
      .filter((cartItem) => (cartItem.productId || cartItem.id) === productId)
      .reduce((quantity, cartItem) => quantity + cartItem.quantity, 0);

  const handleIncreaseQuantity = (item) => {
    const productId = item.productId || item.id;
    if (getProductCartQuantity(productId) >= item.stockQuantity) {
      toast.error(`Only ${item.stockQuantity} ${item.name} item(s) are in stock.`);
      return;
    }
    updateQuantity(item.id, item.quantity + 1);
  };

  const handleHoldOrder = () => {
    toast.success('Order held in the current cart. It will stay here until checkout or removal.');
  };

  const handleCheckoutClose = () => {
    setShowCheckoutModal(false);
    onOrderComplete?.();
  };

  const isEmpty = items.length === 0;

  return (
    <>
      <div className="cart-panel p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="pos-section-title">Current Order</h2>
            <p className="pos-section-copy">
              {isEmpty ? 'Add products from the menu to start a fast cashier checkout.' : 'Review quantities and totals in real time.'}
            </p>
          </div>
          {isEmpty ? (
            <Receipt className="h-6 w-6 text-[#c62828]" />
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#fef9c3] px-3 py-1 text-sm font-extrabold text-[#c62828]">
                {items.length} item{items.length > 1 ? 's' : ''}
              </span>
              <button
                onClick={() => setShowClearConfirm(true)}
                title="Clear entire order"
                className="flex h-7 w-7 items-center justify-center rounded-full text-red-400 transition hover:bg-red-50 hover:text-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {isEmpty ? (
          <div className="py-10 text-center">
            <div className="empty-cart-illustration">
              <ShoppingCart className="h-10 w-10 text-[#c62828]" />
            </div>
            <p className="mt-5 text-lg font-extrabold text-[#5f1717]">Cart is ready</p>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-[#8a5a2b]">
              Tap any item on the left to add it to the order.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 max-h-[360px] space-y-3 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="cart-line-item">
                  {/* Top row: avatar + name + unit price */}
                  <div className="flex items-center gap-3">
                    <div className="cart-item-thumb flex-shrink-0">{item.name?.slice(0, 1)}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-extrabold leading-tight text-[#5f1717]" style={{ wordBreak: 'break-word' }}>{item.name}</h4>
                      <p className="mt-0.5 text-xs font-semibold text-[#8a5a2b]">{formatCurrency(item.price)} each</p>
                      {item.lowStock && (
                        <p className="mt-0.5 text-xs font-medium text-red-600">
                          Only {item.stockQuantity} left
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="flex-shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-red-400 transition-colors hover:bg-red-50 hover:text-red-700"
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Bottom row: stepper + line total */}
                  <div className="mt-3 flex items-center justify-between border-t border-[#f6e2bc] pt-3">
                    <div className="quantity-stepper">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="quantity-button"
                        aria-label={`Decrease ${item.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-8 text-center text-sm font-extrabold text-[#5f1717]">{item.quantity}</span>
                      <button
                        onClick={() => handleIncreaseQuantity(item)}
                        className="quantity-button"
                        aria-label={`Increase ${item.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <span className="font-extrabold text-[#c62828]">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total-box">
              <div className="flex justify-between pos-muted-label">
                <span>Subtotal:</span>
                <span className="font-semibold text-[#6b241d]">{formatCurrency(subtotal)}</span>
              </div>
              {discount && (
                <div className="flex justify-between text-green-600">
                  <span>{discount.type} ({discount.percentage}%):</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#f0d9a7] pt-3 text-xl font-extrabold text-[#c62828]">
                <span>Total:</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button
                onClick={() => setShowDiscountModal(true)}
                className="w-full btn-secondary inline-flex items-center justify-center gap-2 py-3"
              >
                <BadgePercent className="h-4 w-4" />
                {discount ? `Change Discount (${discount.type})` : 'Apply Discount'}
              </button>

              <button onClick={handleHoldOrder} className="w-full hold-order-button">
                <Clock3 className="h-4 w-4" />
                Hold Order
              </button>

              <button
                onClick={() => setShowCheckoutModal(true)}
                className="w-full btn-primary py-3 text-lg font-extrabold"
              >
                Checkout — {formatCurrency(total)}
              </button>
            </div>
          </>
        )}
      </div>

      {showDiscountModal && <DiscountModal onClose={() => setShowDiscountModal(false)} />}
      {showCheckoutModal && <CheckoutModal onClose={handleCheckoutClose} />}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-[#7a1f1f]">Clear entire order?</h3>
            <p className="mt-1 text-sm text-[#a16207]">
              All {items.length} item{items.length !== 1 ? 's' : ''} will be removed. This cannot be undone.
            </p>
            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 btn-secondary py-2.5 text-sm"
              >
                Keep Order
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                  toast.success('Order cleared.');
                }}
                className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
              >
                Clear Order
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Cart;
