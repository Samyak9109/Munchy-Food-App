# Feature Guide

## Authentication and Accounts

- Separate customer and partner registration paths
- Password validation and bcrypt hashing
- Six-digit email OTP verification with expiry and one-time use
- Customer and partner password reset by OTP
- Google OAuth strategies for both roles
- JWT access tokens with a 15-minute lifetime
- Seven-day refresh tokens stored in HTTP-only cookies
- Database-backed sessions with revocation on logout or password reset
- Role-based frontend routes and backend middleware
- Profile updates, avatar uploads, and account deactivation

## Customer Application

### Reels

The home screen displays vertical food videos. Customers can play/pause content, like reels, open and add comments, add the featured food to the cart, open the kitchen, and launch the AI assistant. Views are recorded when content enters the viewport.

### Kitchens and Menus

Customers can search kitchens by name or cuisine and filter for open, highly rated, or favorite locations. Kitchen pages display store information and menu items grouped by food category.

### Nearby Discovery and Directions

Store locations use GeoJSON points and a MongoDB `2dsphere` index. The API can find nearby stores from latitude/longitude and request driving distance, duration, and route geometry from OpenRouteService.

### AI Mood Assistant

Gemini receives the customer's message plus currently available food and nearby-store context. Recommendations are restricted to database items, returned as food cards, and can be added to the cart directly. A deterministic fallback returns available food when the model request fails.

### Cart and Checkout

- Add food from reels, menus, or AI recommendations
- Update quantity, remove items, or clear the cart
- Keep one kitchen per cart
- Add special instructions
- Review subtotal, 5% tax, and total
- Pay using Razorpay card/UPI or select cash on pickup

### Orders and Pickup

Orders progress through `placed`, `confirmed`, `ready`, `pickedup`, or `cancelled`. Customers can inspect order details and cancel eligible orders. A hashed pickup OTP is stored in MongoDB; the plain code is returned for the active order and sent by email.

### Favorites and Reviews

Customers can toggle favorite kitchens. Reviews attach a one-to-five rating and optional comment to a food item and store, with one review permitted per user and food item.

## Partner Application

### Kitchen Management

Partners create a kitchen with its name, address, description, cuisine, coordinates, and hours. They can upload a store image, edit details, delete the store, and toggle whether it is open.

### Menu Management

Partners add food with a name, price, categories, vegetarian flag, image, optional video, and description. Items can be edited, removed, or marked unavailable without deletion.

### Reel Management

Partners associate uploaded videos with menu items, add captions, list store reels, and remove reels.

### Order Operations

The dashboard and orders page show incoming orders by status. Partners must advance an order in sequence from placed to confirmed to ready. A ready order is completed only after the partner verifies the customer's six-digit OTP.

### Analytics

Partner analytics expose daily, weekly, and monthly totals, revenue, average order value, top items, rush hours, growth comparisons, and order-status breakdowns.

## Notifications

Email notifications cover account verification, password reset, order placement, new partner orders, confirmation, ready-for-pickup status, payment success, and completed pickup.

## Design

The interface uses a mobile-first dark visual system with Munchy red, electric yellow, glass overlays, Montserrat headings, Inter body copy, rounded controls, and video-forward layouts. The source design system and exported concepts are in `Design/` and were built using Stitch AI.
