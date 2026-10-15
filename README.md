# ShopKart — Lab 06 (Checkout, Razorpay Test Payment & Orders)

MERN app: React (Vite) + Node/Express + MongoDB, JWT auth in an httpOnly cookie.

## Run it

**Backend**
```bash
cd shopkart-backend
npm install
cp .env.example .env      # then fill in JWT_SECRET and your Razorpay TEST keys
npm run seed              # sample products
npm run dev               # http://localhost:5000
```

**Frontend**
```bash
cd shopkart-frontend
npm install
npm run dev               # http://localhost:5173
```

`.env` needs Razorpay **Test Mode** keys (Dashboard → switch to Test Mode → Account & Settings → API Keys):
`RAZORPAY_KEY_ID=rzp_test_...` and `RAZORPAY_KEY_SECRET=...`. Restart the backend after editing `.env`.
Never commit `.env` (it is in `.gitignore`).

Razorpay test card: `4111 1111 1111 1111`, any future expiry, any CVV, any name; use OTP `1234`/"Success" on the test bank page. In the Razorpay popup you can also pick "Netbanking → Success/Failure" to test both outcomes.

## What changed in Lab 06

### Backend
| File | Change |
|---|---|
| `controllers/order.controller.js` | Rewritten: server-side validation, stock re-check, server total, snapshot, Razorpay order, HMAC verification (timing-safe, trusted order id from DB), atomic claim so a replay can't double-process, atomic stock decrement with rollback, cart cleared only after verified payment, ownership checks, bonus status endpoint |
| `routes/order.routes.js` | All routes protected; adds `POST /orders` (alias), `POST /orders/payment-failed`, `PATCH /orders/:id/status` (bonus) |
| `controllers/cart.controller.js` | Cart responses now always return `{ _id, productId, product|null, quantity }` so deleted products can be shown and removed |
| `utils/validateShipping.js` | New shared shipping validation |
| `index.js` | `CLIENT_URL` CORS, 404 + error handlers |
| `seed.js`, `.env.example`, `.gitignore`, `package.json` | env-based seed (7 products), example env, scripts |

### Frontend
Global state via React Context (`AuthContext`, `CartContext`, `WishlistContext`, `ToastContext`).
Pages: Login, Register, Products, ProductDetails, Wishlist, **Cart**, **Checkout**, **OrderSuccess**, **Orders**, **OrderDetails**, NotFound.
Components: `CheckoutForm`, `OrderSummary`, `OrderCard`, `OrderStatus` (badge + progress tracker), `Navbar` (shows `Cart (n)`), `ProtectedRoute`.
`services/api.js` was fixed to match the real backend routes (`POST /cart/:id`, `PATCH /cart/:id`, `/customers/profile`).

## API
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/orders/create-payment-order` | Validate cart, create PENDING_PAYMENT order + Razorpay order |
| POST | `/orders/verify-payment` | Verify signature → PAID/PLACED, reduce stock, clear cart |
| POST | `/orders/payment-failed` | Mark an unpaid order FAILED (cart kept) |
| GET | `/orders` | My confirmed orders, newest first |
| GET | `/orders/:id` | One order (404 if not yours / not found) |
| PATCH | `/orders/:id/status` | Bonus. Needs `ADMIN_KEY` in `.env` + `x-admin-key` header |

Design notes (good for the viva):
- Someone else's order returns **404**, identical to a non-existent one, so IDs can't be probed.
- `GET /orders` hides unpaid `PENDING_PAYMENT` attempts; abandoned attempts are deleted when the user starts a new checkout.
- Stock is reduced at **verification** time, using `updateOne({stock: {$gte: qty}})` so it can never go negative.

## Postman checklist
1. Login (`POST /customers/login`), keep the cookie.
2. `POST /orders` with empty cart → 400.
3. Add items, `POST /orders/create-payment-order` with a valid address (add `"totalAmount": 1` to prove it's ignored) → 201 with `razorpayOrderId`, amount in paise.
4. `GET /cart` → still full.
5. `POST /orders/verify-payment` with a fake signature → 400, order not PAID, cart still full.
6. Pay in the app (Test Mode) → order PLACED, `GET /cart` → empty, `GET /orders` lists it.
7. Quantity above stock → 400 "Insufficient stock for …".
8. No cookie → 401. Another user's order id → 404.

## Bonus: order status progression
Set `ADMIN_KEY=something` in `.env`, then:
```
PATCH /orders/<id>/status
x-admin-key: something
{ "status": "CONFIRMED" }
```
The Orders page badge and the progress tracker on the order details page update automatically.
