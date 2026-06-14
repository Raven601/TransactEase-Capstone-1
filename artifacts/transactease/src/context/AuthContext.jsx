import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auditLogService, AUDIT_ACTIONS } from '../services/auditLogService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password.trim());
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    const role = userDoc.exists() ? userDoc.data().role : null;
    if (role) setUserRole(role);
    try {
      await setDoc(doc(db, 'loginHistory', `${result.user.uid}_${Date.now()}`), {
        userId: result.user.uid,
        email: result.user.email,
        loginAt: new Date(),
        role,
      });
    } catch { }
    auditLogService.log({
      action: AUDIT_ACTIONS.LOGIN,
      userId: result.user.uid,
      userEmail: result.user.email,
      userRole: role,
      details: { method: 'email' },
    });
    return result;
  };

  const logout = async () => {
    if (currentUser) {
      auditLogService.log({
        action: AUDIT_ACTIONS.LOGOUT,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userRole,
        details: {},
      });
    }
    return signOut(auth);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setCurrentUser(firebaseUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          } else {
            setUserRole('staff');
          }
        } catch {
          setUserRole('staff');
        }
      } else {
        setCurrentUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userRole, login, logout, loading }}>
      {loading ? (
        <div className="app-loading">Loading...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
