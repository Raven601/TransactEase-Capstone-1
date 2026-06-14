import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  getInventoryHealth,
  getSuggestedRestockQuantity,
  isLowStockProduct,
  normalizeProductInventory,
} from '../utils/inventory';
import { groupProductsByCategory, menuCategories } from '../utils/menu';
import { transactionService } from './transactionService';
import { auditLogService, AUDIT_ACTIONS } from './auditLogService';

const COLLECTION_NAME = 'products';

export const productService = {
  subscribeToProducts: (callback) => {
    const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
    return onSnapshot(q, (snapshot) => {
      const normalizedDocs = snapshot.docs.map((d) => ({
        id: d.id,
        ...getInventoryHealth(d.data()),
      }));

      callback({
        ...snapshot,
        docs: normalizedDocs.map((p) => ({ id: p.id, data: () => p })),
        products: normalizedDocs,
      });
    });
  },

  getProductsByCategory: async (category) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('category', '==', category),
      orderBy('name'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...getInventoryHealth(d.data()) }));
  },

  getMenuCategories: () => menuCategories,

  getMenu: async () => {
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const products = snapshot.docs
      .map((d) => ({ id: d.id, ...getInventoryHealth(d.data()) }))
      .sort((a, b) => {
        const cat = (a.category || '').localeCompare(b.category || '');
        return cat || a.name.localeCompare(b.name);
      });
    return groupProductsByCategory(products);
  },

  getProductById: async (productId) => {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, productId));
    if (!snapshot.exists()) {
      throw new Error('Product not found');
    }
    return { id: snapshot.id, ...getInventoryHealth(snapshot.data()) };
  },

  addProduct: async (productData, actor = {}) => {
    const normalized = normalizeProductInventory(productData);
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...productData,
      stock: normalized.stockQuantity,
      stockQuantity: normalized.stockQuantity,
      reorderLevel: normalized.minimumStockThreshold,
      minimumStockThreshold: normalized.minimumStockThreshold,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    auditLogService.log({
      action: AUDIT_ACTIONS.PRODUCT_CREATED,
      userId: actor.uid || null,
      userEmail: actor.email || null,
      userRole: actor.role || null,
      details: { productId: docRef.id, name: productData.name, initialStock: normalized.stockQuantity },
    });
    return docRef.id;
  },

  updateProduct: async (productId, updates, actor = {}) => {
    const productRef = doc(db, COLLECTION_NAME, productId);
    const existing = await getDoc(productRef);
    const normalized = normalizeProductInventory({
      ...(existing.exists() ? existing.data() : {}),
      ...updates,
    });

    const stockIsBeingUpdated =
      updates.stockQuantity !== undefined || updates.stock_quantity !== undefined || updates.stock !== undefined;
    const autoAvailability = stockIsBeingUpdated
      ? { is_available: normalized.stockQuantity > 0, isAvailable: normalized.stockQuantity > 0 }
      : {};

    const prevStock = existing.exists() ? (existing.data().stockQuantity ?? existing.data().stock ?? 0) : null;

    await updateDoc(productRef, {
      ...updates,
      ...autoAvailability,
      stock: normalized.stockQuantity,
      stockQuantity: normalized.stockQuantity,
      reorderLevel: normalized.minimumStockThreshold,
      minimumStockThreshold: normalized.minimumStockThreshold,
      updatedAt: new Date(),
    });

    const isRestock = stockIsBeingUpdated && normalized.stockQuantity > (prevStock || 0);
    auditLogService.log({
      action: isRestock ? AUDIT_ACTIONS.STOCK_RESTOCKED : AUDIT_ACTIONS.PRODUCT_UPDATED,
      userId: actor.uid || null,
      userEmail: actor.email || null,
      userRole: actor.role || null,
      details: {
        productId,
        name: existing.exists() ? existing.data().name : productId,
        ...(stockIsBeingUpdated ? { prevStock, newStock: normalized.stockQuantity } : {}),
      },
    });

    if (stockIsBeingUpdated) {
      addDoc(collection(db, 'inventoryMovements'), {
        productId,
        productName: existing.exists() ? existing.data().name : productId,
        movementType: isRestock ? 'RESTOCK' : 'ADJUSTMENT',
        quantityBefore: prevStock || 0,
        quantityAfter: normalized.stockQuantity,
        delta: normalized.stockQuantity - (prevStock || 0),
        performedBy: actor.email || null,
        performedByRole: actor.role || null,
        timestamp: new Date(),
      }).catch(() => {});
    }
  },

  deleteProduct: async (productId, actor = {}) => {
    const snap = await getDoc(doc(db, COLLECTION_NAME, productId));
    const name = snap.exists() ? snap.data().name : productId;
    await deleteDoc(doc(db, COLLECTION_NAME, productId));
    auditLogService.log({
      action: AUDIT_ACTIONS.PRODUCT_DELETED,
      userId: actor.uid || null,
      userEmail: actor.email || null,
      userRole: actor.role || null,
      details: { productId, name },
    });
  },

  updateStock: async (productId, quantitySold, actor = {}) => {
    const productRef = doc(db, COLLECTION_NAME, productId);
    const existing = await getDoc(productRef);
    const currentStock = existing.exists()
      ? (existing.data().stockQuantity ?? existing.data().stock ?? 0)
      : 0;
    const newStock = Math.max(0, currentStock - quantitySold);
    const availabilityUpdate = newStock === 0 ? { is_available: false, isAvailable: false } : {};

    await updateDoc(productRef, {
      stock: newStock,
      stockQuantity: newStock,
      ...availabilityUpdate,
      updatedAt: new Date(),
    });

    addDoc(collection(db, 'inventoryMovements'), {
      productId,
      productName: existing.exists() ? existing.data().name : productId,
      movementType: 'SALE_DEDUCTION',
      quantityBefore: currentStock,
      quantityAfter: newStock,
      delta: -quantitySold,
      performedBy: actor.email || null,
      timestamp: new Date(),
    }).catch(() => {});
  },

  getLowStockProducts: async () => {
    const products = await productService.getInventoryReport();
    return products.filter((p) => p.lowStock);
  },

  getInventoryReport: async () => {
    const [productSnapshot, recentTransactions] = await Promise.all([
      getDocs(collection(db, COLLECTION_NAME)),
      transactionService.getRecentTransactions(50),
    ]);

    const recentSalesMap = recentTransactions.reduce((map, t) => {
      t.items?.forEach((item) => {
        map[item.id] = (map[item.id] || 0) + item.quantity;
      });
      return map;
    }, {});

    return productSnapshot.docs
      .map((d) => {
        const base = { id: d.id, ...d.data() };
        const recentUnitsSold = recentSalesMap[d.id] || 0;
        return {
          ...getInventoryHealth(base, recentUnitsSold),
          recentUnitsSold,
          suggestedRestockQuantity: getSuggestedRestockQuantity(base, recentUnitsSold),
        };
      })
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  },

  subscribeToLowStockProducts: (callback) => {
    return productService.subscribeToProducts(async (snapshot) => {
      const recentTransactions = await transactionService.getRecentTransactions(50);
      const recentSalesMap = recentTransactions.reduce((map, t) => {
        t.items?.forEach((item) => {
          map[item.id] = (map[item.id] || 0) + item.quantity;
        });
        return map;
      }, {});

      const lowStockProducts = (snapshot.products || [])
        .map((p) => ({
          ...p,
          recentUnitsSold: recentSalesMap[p.id] || 0,
          suggestedRestockQuantity: getSuggestedRestockQuantity(p, recentSalesMap[p.id] || 0),
        }))
        .filter((p) => isLowStockProduct(p));

      callback(lowStockProducts);
    });
  },
};
