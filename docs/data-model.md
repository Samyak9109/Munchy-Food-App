# Data Model

## Relationships

```text
Partner 1--* Store 1--* Food
                    \--* Reel
                    \--* Order

User 1--1 Cart
User 1--* Order 1--1 Payment
User 1--* Review
User 1--* Favorite
User 1--* Like
User 1--* Comment
User/Partner 1--* Session
```

## Collections

### User and Partner

Both account types contain name, unique email, optional password for OAuth accounts, Google ID, avatar, phone, verification state, role, active state, and timestamps. Partners additionally maintain store references.

### Session

Stores the account ID, role, hashed refresh token, IP, user agent, revoked flag, and timestamps. Logout and password reset revoke sessions.

### OTP

Stores email, hashed OTP, purpose, role, expiry, used state, and timestamps. Purposes are `register`, `resetPassword`, and `orderPickup`.

### Store

Stores partner ownership, name, description, image, address, cuisine, GeoJSON location, legacy coordinates, hours, open state, aggregate rating, and timestamps.

Index: `location` has a `2dsphere` index for nearby queries.

### Food

Stores store and partner ownership, name, description, price, category list, required image, optional video, vegetarian flag, availability, ratings, and timestamps.

Categories: `breakfast`, `lunch`, `dinner`, `snacks`, `drinks`, `desserts`.

### Reel

References food, partner, and store, and stores video URL, caption, like count, view count, comment count, and timestamps.

### Like and Comment

Likes reference a user and reel with a unique compound index, preventing duplicate likes. Comments reference a user and reel and store free-form text.

### Favorite

References a user and store. A unique compound index permits one favorite record per user/store pair.

### Cart

References one user and one store. Items store food, quantity, and captured price. The document stores a calculated total and timestamps.

### Order

References user, store, item snapshots, total, status, payment, pickup time, hashed OTP, pickup code, note, and timestamps.

Statuses: `placed`, `confirmed`, `ready`, `pickedup`, `cancelled`.

The `otp` and `pickupCode` fields are excluded from ordinary queries by default.

### Payment

References user and order and stores amount, method, status, gateway ID, and timestamps.

Methods: `card`, `upi`, `cash`.  
Statuses: `pending`, `success`, `failed`.

### Review

References user, food, and store and stores a one-to-five rating and comment. A unique compound index permits one review per user/food pair.
