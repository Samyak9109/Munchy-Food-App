import api from './client';

// ── FOOD ─────────────────────────────────────────────────────
export const getFood         = ()       => api.get('/food');
export const getFoodById     = (id)     => api.get(`/food/${id}`);
export const getFoodByCategory = (cat)  => api.get(`/food/category/${cat}`);
export const createFood      = (data)   => api.post('/food/addFood', data);   // FormData
export const updateFood      = (id, d)  => api.put(`/food/${id}`, d);
export const deleteFood      = (id)     => api.delete(`/food/${id}`);
export const toggleAvailability = (id)  => api.patch(`/food/${id}/availability`);

// ── STORE ────────────────────────────────────────────────────
export const getStores       = ()       => api.get('/store');
export const getStoreById    = (id)     => api.get(`/store/${id}`);
export const getStoreMenu    = (id)     => api.get(`/store/${id}/menu`);
export const createStore     = (data)   => api.post('/store', data);
export const updateStore     = (id, d)  => api.put(`/store/${id}`, d);
export const deleteStore     = (id)     => api.delete(`/store/${id}`);
export const toggleStoreStatus = (id)   => api.patch(`/store/${id}/status`);
export const uploadStoreImage  = (id, data) => api.post(`/store/${id}/image`, data);

// ── CART ─────────────────────────────────────────────────────
export const getCart         = ()       => api.get('/cart');
export const addToCart       = (data)   => api.post('/cart/add', data);
export const updateCartQty   = (data)   => api.put('/cart/update', data);
export const removeFromCart  = (foodId) => api.delete(`/cart/remove/${foodId}`);
export const clearCart       = ()       => api.delete('/cart/clear');

// ── ORDER ────────────────────────────────────────────────────
export const placeOrder      = (data)   => api.post('/order/place', data);
export const getOrders       = ()       => api.get('/order');
export const getOrderById    = (id)     => api.get(`/order/${id}`);
export const getOrderByIdPartner = (id) => api.get(`/order/partner/${id}`);
export const cancelOrder     = (id)     => api.patch(`/order/${id}/cancel`);
export const getStoreOrders  = (storeId) => api.get(`/order/store/${storeId}`);
export const updateOrderStatus = (id, data) => api.patch(`/order/partner/${id}/status`, data);
export const verifyPickupOTP = (id, data) => api.patch(`/order/partner/${id}/verify`, data);

// ── PAYMENT ──────────────────────────────────────────────────
export const initiatePayment = (data)   => api.post('/payment/initiate', data);
export const verifyPayment   = (data)   => api.post('/payment/verify', data);
export const cashPayment     = (data)   => api.post('/payment/cash', data);
export const getPaymentHistory = ()     => api.get('/payment/history');

// ── REVIEW ───────────────────────────────────────────────────
export const addReview       = (data)   => api.post('/review', data);
export const getFoodReviews  = (foodId) => api.get(`/review/food/${foodId}`);
export const getStoreReviews = (storeId)=> api.get(`/review/store/${storeId}`);
export const deleteReview    = (id)     => api.delete(`/review/${id}`);

// ── REELS ────────────────────────────────────────────────────
export const getReels        = ()       => api.get('/reel');
export const getReelsByStore = (storeId)=> api.get(`/reel/store/${storeId}`);
export const createReel      = (data)   => api.post('/reel', data);           // FormData
export const deleteReel      = (id)     => api.delete(`/reel/${id}`);
export const toggleLike      = (id)     => api.post(`/reel/${id}/like`);
export const addComment      = (id, data) => api.post(`/reel/${id}/comment`, data);
export const getComments     = (id)     => api.get(`/reel/${id}/comments`);
export const deleteComment   = (id, commentId) => api.delete(`/reel/${id}/comment/${commentId}`);
export const incrementViews  = (id)     => api.patch(`/reel/${id}/view`);

// ── FAVORITES ────────────────────────────────────────────────
export const toggleFavorite  = (storeId) => api.post(`/favorite/${storeId}`);
export const getFavorites    = ()        => api.get('/favorite');

// ── MAP ──────────────────────────────────────────────────────
export const getNearbyStores = (params) => api.get('/map/nearby', { params });
export const getDirections   = (storeId, params) => api.get(`/map/directions/${storeId}`, { params });

// ── DASHBOARD ────────────────────────────────────────────────
export const getDailyStats   = (storeId) => api.get(`/dashboard/${storeId}/daily`);
export const getWeeklyStats  = (storeId) => api.get(`/dashboard/${storeId}/weekly`);
export const getMonthlyStats = (storeId) => api.get(`/dashboard/${storeId}/monthly`);
export const getTopItems     = (storeId) => api.get(`/dashboard/${storeId}/top-items`);
export const getRushHours    = (storeId) => api.get(`/dashboard/${storeId}/rush-hours`);
export const getGrowth       = (storeId) => api.get(`/dashboard/${storeId}/growth`);
export const getStatusBreakdown = (storeId) => api.get(`/dashboard/${storeId}/breakdown`);

// ── CHATBOT ──────────────────────────────────────────────────
export const sendChatMessage = (data)   => api.post('/chatbot', data);

// ── USER ─────────────────────────────────────────────────────
export const getProfile      = ()       => api.get('/user/profile');
export const updateProfile   = (data)   => api.put('/user/profile', data);
export const deleteAccount   = ()       => api.delete('/user/profile');
