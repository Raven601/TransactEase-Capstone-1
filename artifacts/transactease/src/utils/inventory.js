const DEFAULT_MINIMUM_STOCK_THRESHOLD = 5;
const DEFAULT_RESTOCK_TARGET = 20;

export const getProductStock = (product = {}) => {
  const value = Number(product.stockQuantity ?? product.stock ?? 0);
  return Number.isFinite(value) ? Math.max(0, value) : 0;
};

export const getMinimumStockThreshold = (product = {}) => {
  const value = Number(product.minimumStockThreshold ?? product.reorderLevel ?? DEFAULT_MINIMUM_STOCK_THRESHOLD);
  return Number.isFinite(value) ? Math.max(0, value) : DEFAULT_MINIMUM_STOCK_THRESHOLD;
};

export const normalizeProductInventory = (product = {}) => {
  const stockQuantity = getProductStock(product);
  const minimumStockThreshold = getMinimumStockThreshold(product);

  return {
    ...product,
    stock: stockQuantity,
    stockQuantity,
    reorderLevel: minimumStockThreshold,
    minimumStockThreshold,
  };
};

export const isLowStockProduct = (product = {}) => {
  const normalizedProduct = normalizeProductInventory(product);
  return normalizedProduct.stockQuantity <= normalizedProduct.minimumStockThreshold;
};

export const getSuggestedRestockQuantity = (product = {}, recentUnitsSold = 0) => {
  const normalizedProduct = normalizeProductInventory(product);
  const stockBuffer = normalizedProduct.minimumStockThreshold * 4;
  const salesBuffer = recentUnitsSold > 0 ? recentUnitsSold * 2 : 0;
  const targetStockLevel = Math.max(DEFAULT_RESTOCK_TARGET, stockBuffer, salesBuffer);

  return Math.max(targetStockLevel - normalizedProduct.stockQuantity, 0);
};

export const getInventoryHealth = (product = {}, recentUnitsSold = 0) => {
  const normalizedProduct = normalizeProductInventory(product);
  const lowStock = isLowStockProduct(normalizedProduct);
  const outOfStock = normalizedProduct.stockQuantity === 0;

  return {
    ...normalizedProduct,
    lowStock,
    outOfStock,
    suggestedRestockQuantity: getSuggestedRestockQuantity(normalizedProduct, recentUnitsSold),
    statusLabel: outOfStock ? 'Out of Stock' : lowStock ? 'Low Stock' : 'In Stock',
  };
};
