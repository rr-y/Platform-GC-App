# Platform GC — Frontend

Expo React Native app (Android + Web) for the loyalty & rewards platform.

## Stack
- **Framework**: Expo SDK 54 + React Native
- **Language**: TypeScript
- **Navigation**: Expo Router v6 (file-based routing)
- **State**: Zustand (auth store, cart store stub)
- **API**: TanStack Query + axios
- **UI**: React Native Paper (Material Design 3, primary `#6200ee`)
- **Storage**: expo-secure-store (native) / localStorage (web)

## Project structure
```
app/
  _layout.tsx          — root: QueryClientProvider + PaperProvider + AuthGuard
  (auth)/
    mobile.tsx         — phone number entry
    otp.tsx            — 6-box OTP verification
  (tabs)/
    index.tsx          — Home: balance + expiry banner + last 3 transactions
    coins.tsx          — full coin history (infinite scroll)
    offers.tsx         — coupon checker + available offers
    profile.tsx        — name edit + logout

src/
  api/
    client.ts          — axios instance, auth interceptor, auto token refresh on 401
    auth.ts / coins.ts / transactions.ts / coupons.ts
  store/
    auth.ts            — Zustand: user, tokens, isAuthenticated, restoreSession
    cart.ts            — stub for future product delivery feature
  components/
    CoinCard.tsx / ExpiryBanner.tsx / TransactionItem.tsx / OtpInput.tsx
  utils/
    tokens.ts          — SecureStore (native) + localStorage (web) wrappers
    format.ts          — currency (₹), coins, date formatters
```

## Commands

```bash
# Start dev server
npx expo start

# Web only
npx expo start --web

# Android
npx expo start --android

# Install packages (always use legacy-peer-deps flag with npm)
npx expo install <package> -- --legacy-peer-deps

# Build Android APK
eas build --platform android
```

## Key rules
- `EXPO_PUBLIC_API_URL` must be set in `.env` — never hardcode the API URL
- `client.ts` always appends `/api/v1` to `EXPO_PUBLIC_API_URL`
- `tokens.ts` uses `localStorage` on web, `SecureStore` on native — do not call SecureStore directly
- Web output mode is `single` (SPA) — not `static` (breaks auth redirects)
- Install packages with `npx expo install` not `npm install` — ensures SDK compatibility

## Auth flow
```
App open → restoreSession() → check localStorage/SecureStore
  ├── No token → /(auth)/mobile → /(auth)/otp → /(tabs)/
  └── Token found → /(tabs)/
```
Axios interceptor silently refreshes expired access tokens using the refresh token.

## Environment
```bash
# .env (local dev)
EXPO_PUBLIC_API_URL=http://localhost:8000

# .env (production — point to Railway URL)
EXPO_PUBLIC_API_URL=https://your-api.railway.app
```

## Future delivery extension
`src/store/cart.ts` is already stubbed. When ready:
- Add `app/(tabs)/shop.tsx`, `app/product/[id].tsx`, `app/cart.tsx`
- Implement cart store
- Backend: add `products` + `orders` tables and endpoints
