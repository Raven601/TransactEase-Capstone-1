export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amount || 0);
};

export const calculateTax = (amount) => {
  return amount * 0.08;
};

export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};
