import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { createQrToken, createReceiptQrValue } from './qrService';
import { getInventoryHealth, isLowStockProduct } from '../utils/inventory';
import { auditLogService, AUDIT_ACTIONS } from './auditLogService';

const COLLECTION_NAME = 'transactions';
const PRODUCTS_COLLECTION_NAME = 'products';

const sanitize = (obj) => {
  if (Array.isArray(obj)) return obj.map(sanitize);
  if (obj !== null && typeof obj === 'object' && !(obj?.toDate || obj?.seconds)) {
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, sanitize(v)])
    );
  }
  return obj;
};

const addQrMetadata = (transactionData, transactionId) => {
  const qrToken = transactionData.qrToken || createQrToken();
  return {
    ...transactionData,
    orderStatus: transactionData.orderStatus || 'Completed',
    paymentStatus: transactionData.paymentStatus || 'Paid',
    qrToken,
    qrPayload: createReceiptQrValue(transactionId, qrToken),
  };
};

export const transactionService = {
  createTransaction: async (transactionData) => {
    const transactionRef = doc(collection(db, COLLECTION_NAME));
    const transactionWithQr = sanitize(addQrMetadata(transactionData, transactionRef.id));

    await runTransaction(db, async (fbTx) => {
      fbTx.set(transactionRef, { ...transactionWithQr, timestamp: new Date() });
    });

    return transactionRef.id;
  },

  createTransactionWithInventory: async (transactionData) => {
    return await runTransaction(db, async (fbTx) => {
      const lowStockItems = [];

      // Aggregate quantities per product to handle duplicate cart items
      const productQuantities = transactionData.items.reduce((map, item) => {
        const productId = item.productId || item.id;
        const existing = map.get(productId) || { quantity: 0, names: [] };
        map.set(productId, {
          quantity: existing.quantity + item.quantity,
          names: [...existing.names, item.name],
        });
        return map;
      }, new Map());

      const inventoryUpdates = [];

      for (const [productId, cartProduct] of productQuantities.entries()) {
        const productRef = doc(db, PRODUCTS_COLLECTION_NAME, productId);
        const productSnapshot = await fbTx.get(productRef);

        if (!productSnapshot.exists()) {
          throw new Error(`${cartProduct.names.join(', ')} could not be found in inventory.`);
        }

        const product = { id: productSnapshot.id, ...productSnapshot.data() };
        const normalized = getInventoryHealth(product);

        if (normalized.stockQuantity < cartProduct.quantity) {
          throw new Error(`Only ${normalized.stockQuantity} ${product.name} item(s) are available.`);
        }

        const nextQty = normalized.stockQuantity - cartProduct.quantity;
        const nextState = getInventoryHealth({ ...product, stock: nextQty, stockQuantity: nextQty });

        inventoryUpdates.push({ productRef, nextQty });

        if (isLowStockProduct(nextState)) {
          lowStockItems.push(nextState);
        }
      }

      inventoryUpdates.forEach(({ productRef, nextQty }) => {
        fbTx.update(productRef, { stock: nextQty, stockQuantity: nextQty, updatedAt: new Date() });
      });

      const transactionRef = doc(collection(db, COLLECTION_NAME));
      const transactionWithQr = sanitize(addQrMetadata(transactionData, transactionRef.id));

      fbTx.set(transactionRef, { ...transactionWithQr, timestamp: new Date() });

      return {
        id: transactionRef.id,
        transaction: { id: transactionRef.id, ...transactionWithQr, timestamp: new Date() },
        lowStockItems,
      };
    }).then((result) => {
      auditLogService.log({
        action: AUDIT_ACTIONS.TRANSACTION_COMPLETED,
        userId: transactionData.cashierId || null,
        userEmail: transactionData.cashierEmail || null,
        userRole: transactionData.cashierRole || null,
        details: {
          transactionId: result.id,
          totalAmount: transactionData.totalAmount,
          itemCount: transactionData.items?.length || 0,
        },
      });
      return result;
    });
  },

  getTransactionByQr: async ({ transactionId, token }) => {
    if (!transactionId || !token) {
      throw new Error('Invalid QR code. Missing transaction security details.');
    }

    const snapshot = await getDoc(doc(db, COLLECTION_NAME, transactionId));

    if (!snapshot.exists()) {
      throw new Error('Transaction was not found.');
    }

    const transaction = { id: snapshot.id, ...snapshot.data() };

    if (transaction.qrToken !== token) {
      throw new Error('QR validation failed. This receipt may be expired or altered.');
    }

    return transaction;
  },

  validateQrUrl: async (rawValue) => {
    let parsedUrl;
    try {
      parsedUrl = new URL(rawValue);
    } catch {
      throw new Error('Scanned QR is not a valid TransactEase receipt URL.');
    }

    const pathMatch = parsedUrl.pathname.match(/\/qr-receipt\/([^/]+)/);
    const token = parsedUrl.searchParams.get('token');

    if (!pathMatch || !token) {
      throw new Error('Scanned QR does not contain a valid receipt token.');
    }

    return transactionService.getTransactionByQr({ transactionId: pathMatch[1], token });
  },

  getTodaysTransactions: async () => {
    const today = new Date();
    const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const q = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', start),
      where('timestamp', '<', end),
      orderBy('timestamp', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getRecentTransactions: async (limitCount = 10) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getTransactionsByDateRange: async (startDate, endDate) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('timestamp', '>=', startDate),
      where('timestamp', '<', endDate),
      orderBy('timestamp', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getDailySalesSummary: async () => {
    const transactions = await transactionService.getTodaysTransactions();
    return {
      totalSales: transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0),
      totalOrders: transactions.length,
      transactions,
    };
  },
};
