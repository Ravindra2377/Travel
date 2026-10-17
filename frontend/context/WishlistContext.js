import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const WishlistContext = createContext({
  wishlist: [],
  toggleWishlist: () => {},
  isLiked: () => false,
});

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    try {
      const stored = await AsyncStorage.getItem("wishlist");
      if (stored) {
        setWishlist(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Failed to load wishlist", e);
    }
  };

  const toggleWishlist = async (product) => {
    try {
      let newWishlist;
      const exists = wishlist.find((item) => item.id === product.id);
      
      if (exists) {
        newWishlist = wishlist.filter((item) => item.id !== product.id);
      } else {
        newWishlist = [...wishlist, product];
      }
      
      setWishlist(newWishlist);
      await AsyncStorage.setItem("wishlist", JSON.stringify(newWishlist));
    } catch (e) {
      console.log("Failed to update wishlist", e);
    }
  };

  const isLiked = (productId) => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isLiked }}>
      {children}
    </WishlistContext.Provider>
  );
};
