import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCart } from '../../context/CartContext';
import { discountService } from '../../services/discountService';

const DiscountModal = ({ onClose }) => {
  const { setDiscount, discount } = useCart();
  const [discountTypes, setDiscountTypes] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selected, setSelected]           = useState('');
  const [customPct, setCustomPct]         = useState('');

  useEffect(() => {
    discountService.getActiveDiscounts().then((list) => {
      setDiscountTypes(list);
      setLoading(false);
    });
  }, []);

  const handleApply = () => {
    if (!selected) { toast.error('Please select a discount type.'); return; }

    const type = discountTypes.find((d) => d.id === selected);
    if (!type) return;

    if (type.id === 'promo') {
      const pct = parseFloat(customPct);
      if (!pct || pct <= 0 || pct > 100) {
        toast.error('Please enter a valid percentage (1–100).');
        return;
      }
      setDiscount({ type: type.name, percentage: pct });
      toast.success(`${type.name} discount applied (${pct}%)`);
    } else {
      setDiscount({ type: type.name, percentage: type.percentage });
      toast.success(`${type.name} discount applied (${type.percentage}%)`);
    }
    onClose();
  };

  const handleRemove = () => {
    setDiscount(null);
    toast.success('Discount removed.');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#fde68a] px-6 py-5">
          <h3 className="font-extrabold text-[#7a1f1f]">Apply Discount</h3>
          <button onClick={onClose} className="rounded-full p-1.5 text-[#a16207] hover:bg-[#fefce8]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-[#a16207]" />
            </div>
          ) : (
            <div className="space-y-2">
              {discountTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                    selected === type.id
                      ? 'border-[#dc2626] bg-red-50'
                      : 'border-[#fde68a] bg-[#fefce8] hover:border-[#dc2626]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="discount"
                      value={type.id}
                      checked={selected === type.id}
                      onChange={() => setSelected(type.id)}
                      className="h-4 w-4 accent-[#dc2626]"
                    />
                    <div>
                      <p className="font-semibold text-[#5f1717]">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-[#a16207]">{type.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="ml-2 flex-shrink-0 rounded-full bg-[#fde68a] px-2.5 py-0.5 text-xs font-extrabold text-[#7a1f1f]">
                    {type.id === 'promo' ? 'Custom' : `${type.percentage}%`}
                  </span>
                </label>
              ))}
            </div>
          )}

          {selected === 'promo' && (
            <div>
              <label className="login-label mb-1.5 block">Custom Percentage (%)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={customPct}
                onChange={(e) => setCustomPct(e.target.value)}
                className="login-input"
                placeholder="Enter percentage (1–100)"
                autoFocus
              />
            </div>
          )}

          {discount && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Current: <strong>{discount.type}</strong> ({discount.percentage}%)
            </div>
          )}

          <div className="flex gap-3 pt-1">
            {discount && (
              <button onClick={handleRemove} className="flex-1 btn-secondary py-3 text-sm">
                Remove
              </button>
            )}
            <button onClick={handleApply} className="flex-1 btn-primary py-3 text-sm font-bold" disabled={loading}>
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DiscountModal;
