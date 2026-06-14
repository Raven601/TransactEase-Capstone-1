import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'auditLogs';

export const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PRODUCT_CREATED: 'PRODUCT_CREATED',
  PRODUCT_UPDATED: 'PRODUCT_UPDATED',
  PRODUCT_DELETED: 'PRODUCT_DELETED',
  STOCK_RESTOCKED: 'STOCK_RESTOCKED',
  TRANSACTION_COMPLETED: 'TRANSACTION_COMPLETED',
  QR_SCANNED: 'QR_SCANNED',
  FORECAST_RUN: 'FORECAST_RUN',
  DISCOUNT_APPLIED: 'DISCOUNT_APPLIED',
};

export const auditLogService = {
  log: async ({ action, userId, userEmail, userRole, details = {} }) => {
    try {
      await addDoc(collection(db, COLLECTION), {
        action,
        userId: userId || null,
        userEmail: userEmail || null,
        userRole: userRole || null,
        details,
        timestamp: new Date(),
      });
    } catch {
      // Audit log failure must never block the main action
    }
  },

  getRecentLogs: async (limitCount = 100) => {
    const q = query(
      collection(db, COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getLogsByDateRange: async (startDate, endDate) => {
    const q = query(
      collection(db, COLLECTION),
      where('timestamp', '>=', startDate),
      where('timestamp', '<', endDate),
      orderBy('timestamp', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },

  getLogsByAction: async (action, limitCount = 50) => {
    const q = query(
      collection(db, COLLECTION),
      where('action', '==', action),
      orderBy('timestamp', 'desc'),
      limit(limitCount),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  },
};
