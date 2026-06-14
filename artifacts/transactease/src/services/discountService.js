import {
  collection, doc, getDocs, onSnapshot, setDoc, updateDoc,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'discountConfig';

export const DEFAULT_DISCOUNTS = [
  { id: 'senior_citizen', name: 'Senior Citizen', percentage: 20, isActive: true, isFixed: true,  description: 'Mandatory — RA 9994' },
  { id: 'pwd',            name: 'PWD',            percentage: 20, isActive: true, isFixed: true,  description: 'Mandatory — RA 9442' },
  { id: 'employee',       name: 'Employee',       percentage: 10, isActive: true, isFixed: false, description: 'Staff / crew benefit' },
  { id: 'promo',          name: 'Promo',          percentage: 0,  isActive: true, isFixed: false, description: 'Custom percentage — set at checkout' },
];

export const discountService = {
  getDiscounts: async () => {
    try {
      const snap = await getDocs(collection(db, COLLECTION));
      if (snap.empty) {
        await discountService.seedDefaults();
        return DEFAULT_DISCOUNTS;
      }
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch {
      return DEFAULT_DISCOUNTS;
    }
  },

  subscribeToDiscounts: (callback) => {
    try {
      const unsub = onSnapshot(collection(db, COLLECTION), (snap) => {
        if (snap.empty) {
          discountService.seedDefaults().then(() => callback(DEFAULT_DISCOUNTS));
        } else {
          callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        }
      }, () => callback(DEFAULT_DISCOUNTS));
      return unsub;
    } catch {
      callback(DEFAULT_DISCOUNTS);
      return () => {};
    }
  },

  seedDefaults: async () => {
    for (const d of DEFAULT_DISCOUNTS) {
      await setDoc(doc(db, COLLECTION, d.id), d, { merge: true });
    }
  },

  updateDiscount: async (id, updates) => {
    await updateDoc(doc(db, COLLECTION, id), updates);
  },

  getActiveDiscounts: async () => {
    const all = await discountService.getDiscounts();
    return all.filter((d) => d.isActive);
  },
};
