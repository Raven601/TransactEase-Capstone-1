import menuData from '../data/menuData.json';

export const DEFAULT_MENU_STOCK_QUANTITY = 20;
export const DEFAULT_MENU_MINIMUM_STOCK_THRESHOLD = 5;

export const slugify = (value = '') =>
  value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const getMenuSku = (product) => {
  const categoryPrefix = slugify(product.category)
    .split('-')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 4)
    .toUpperCase();

  return `${categoryPrefix}-${slugify(product.name).toUpperCase()}`;
};

export const getMenuProductId = (product) =>
  `${slugify(product.category)}-${slugify(product.name)}`;

export const menuCategories = menuData.categories;

export const menuProducts = menuData.products.map((product) => ({
  ...product,
  id: getMenuProductId(product),
  sku: product.sku || getMenuSku(product),
  stock: DEFAULT_MENU_STOCK_QUANTITY,
  stockQuantity: DEFAULT_MENU_STOCK_QUANTITY,
  reorderLevel: DEFAULT_MENU_MINIMUM_STOCK_THRESHOLD,
  minimumStockThreshold: DEFAULT_MENU_MINIMUM_STOCK_THRESHOLD,
}));

export const groupProductsByCategory = (products = menuProducts) =>
  menuCategories.reduce((groupedProducts, category) => {
    groupedProducts[category] = products.filter((product) => product.category === category);
    return groupedProducts;
  }, {});

export const getVariantPriceSummary = (product = {}) =>
  product.variants?.length
    ? product.variants.map((variant) => `${variant.name}: ${variant.price}`).join(', ')
    : null;
