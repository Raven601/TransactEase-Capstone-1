import React, { createContext, useContext, useEffect, useReducer } from 'react';

const CartContext = createContext();
const CART_STORAGE_KEY = 'transactease-pos-cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART':
      const existingItemIndex = state.items.findIndex(
        item => item.id === action.payload.id
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += 1;
        return { ...state, items: updatedItems };
      }
      
      return {
        ...state,
        items: [...state.items, { ...action.payload, quantity: 1 }]
      };

    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };

    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      return { ...state, items: updatedItems };

    case 'SET_DISCOUNT':
      return { ...state, discount: action.payload };

    case 'CLEAR_CART':
      return { items: [], discount: null };

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(
    cartReducer,
    {
      items: [],
      discount: null
    },
    (initialState) => {
      try {
        const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
        return storedCart ? JSON.parse(storedCart) : initialState;
      } catch (error) {
        console.error('Failed to restore cart from localStorage:', error);
        return initialState;
      }
    }
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to persist cart to localStorage:', error);
    }
  }, [state]);

  const addToCart = (product) => {
    dispatch({ type: 'ADD_TO_CART', payload: product });
  };

  const removeFromCart = (cartItemId) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: cartItemId });
  };

  const updateQuantity = (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', payload: { id: cartItemId, quantity } });
    }
  };

  const setDiscount = (discount) => {
    dispatch({ type: 'SET_DISCOUNT', payload: discount });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getSubtotal = () => {
    return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getDiscountAmount = () => {
    if (!state.discount) return 0;
    const subtotal = getSubtotal();
    return (subtotal * state.discount.percentage) / 100;
  };

  const getTotal = () => {
    return getSubtotal() - getDiscountAmount();
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    updateQuantity,
    setDiscount,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTotal
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
