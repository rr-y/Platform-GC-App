# GC Super App — Play Store Submission Kit

Everything needed for the Google Play Console listing. Paste text fields directly; capture screenshots and graphics per the specs below.

---

## 1. Store listing text

### App name (30 chars)
```
GC Super App
```

### Short description (80 chars)
```
Earn coins on every visit. Redeem exclusive offers. Track rewards instantly.
```

### Full description (≤ 4000 chars)
```
GC Super App is your all-in-one loyalty and rewards companion. Earn coins on every visit, track your balance, redeem exclusive offers, and never miss a deal — all from one simple app.

✨ WHAT YOU CAN DO

• Earn & track coins — See your active coin balance update in real time
• Never miss expiring coins — Get timely alerts before your coins expire
• Browse exclusive offers — Discover curated deals with auto-applied and coupon-code offers
• Validate coupons instantly — Type any code to check if it's valid and see how much you save
• View full transaction history — Every coin earned, redeemed, or expired, neatly logged
• Secure OTP login — No passwords. Just your mobile number and a one-time code

🪙 HOW TO EARN COINS

1. Sign up with your mobile number (OTP verified — takes 30 seconds)
2. Shop or transact at participating Platform GC partners
3. Coins are credited automatically to your account
4. Redeem coins against future purchases or exclusive member offers

🎁 HOW TO REDEEM

• Visit the Offers tab to browse available deals
• Auto-applied offers are used at checkout automatically
• Coupon-code offers — copy the code and share at billing
• Use the Check a Coupon tool to validate any code before you go

🔒 YOUR DATA IS SAFE

• OTP-based login — no passwords stored
• Secure token storage on your device
• Data transmitted over HTTPS

Perfect for loyal customers who want every rupee of reward accounted for. Start earning today!
```

### Category
Shopping (primary) · Lifestyle (secondary)

### Tags / Keywords
`loyalty, rewards, coins, offers, coupons, cashback, deals, membership`

### Contact details
- Email: `rahulrajyadav2022@gmail.com`
- Website: (optional) your landing page URL
- Privacy policy URL: host `privacy-policy.html` and use that URL

---

## 2. Graphic assets — specs & checklist

| Asset | Size | Format | Notes |
|---|---|---|---|
| App icon | 512 × 512 | 32-bit PNG, no alpha | Export from `assets/icon.png` |
| Feature graphic | 1024 × 500 | PNG or JPG | App logo + tagline on `#6200ee` |
| Phone screenshots | 1080 × 1920 or 1080 × 2400 | PNG or JPG | 2 to 8 images (recommend 6) |
| (Optional) Tablet 7" | 1200 × 1920 | PNG | Skip — app is phone-first |
| (Optional) Promo video | YouTube link | 30–120s | Optional |

### Screenshot capture plan (6 shots)

Run on Android device/emulator with a seeded test user (some coins, 1–2 transactions, at least one active offer). Use `adb exec-out screencap -p > shot.png` or Android Studio device screenshot.

1. **Home** — greeting + coin balance card + expiry banner + recent transactions
2. **Coins** — full history with earned / redeemed / expired chips
3. **Offers — Available Offers** — offer banner cards with discount badges
4. **Offers — Coupon Check** — typed code with `Valid! Saves you ₹X` helper
5. **Profile** — avatar, display name, verified mobile badge
6. **Login** — either mobile entry or 6-box OTP screen

Tip: add a short caption overlay per screenshot in Canva (e.g. *Track your coins*, *Redeem offers*, *Login with OTP*).

---

## 3. How to use (for onboarding or Play listing extras)

1. Open the app and enter your mobile number.
2. Verify with the OTP sent to your phone.
3. View your coin balance on the Home screen.
4. Check the **Offers** tab for deals and to validate a coupon code.
5. Track every coin movement in the **Coins** tab.
6. Update your display name anytime from **Profile**.

---

## 4. How to earn coins (user-facing)

- **Sign up** with your mobile number (OTP verified).
- **Transact** at participating Platform GC partners.
- Coins are **credited automatically** to your account within minutes.
- **Redeem** coins against future purchases or exclusive offers.
- Watch the **expiry banner** on Home so coins don't expire unused.

---

## 5. Data Safety form (Play Console answers)

**Does your app collect or share user data?** Yes

| Data type | Collected | Shared | Required | Purpose | Encrypted in transit | User can request deletion |
|---|---|---|---|---|---|---|
| Phone number | Yes | No | Required | Account management, auth | Yes | Yes |
| Name | Yes | No | Optional | Account management | Yes | Yes |
| App interactions (coin ledger) | Yes | No | Required | App functionality, analytics | Yes | Yes |
| Device or other IDs (push token) | Yes | No | Optional | Notifications | Yes | Yes |

**Data deletion mechanism:** email request to `rahulrajyadav2022@gmail.com` (mentioned in privacy policy section 6 & 8).

---

## 6. Content rating

Answer the IARC questionnaire with **No** to all violence, drugs, gambling, and mature content prompts → rating: **Everyone**.

---

## 7. Permissions declared

After the cleanup in this branch, the Android manifest only includes permissions Expo adds by default (INTERNET, notifications). No sensitive permissions.

---

## 8. Release checklist

- [ ] Host `privacy-policy.html` on a public URL (GitHub Pages, Netlify, or any static host)
- [ ] Create `1024 × 500` feature graphic
- [ ] Capture 6 phone screenshots with seeded data
- [ ] `eas build --platform android --profile production` to get signed `.aab`
- [ ] Upload `.aab` to Play Console → Internal testing track first
- [ ] Fill Data Safety form as above
- [ ] Complete IARC content rating questionnaire
- [ ] Set Countries: India only for first release
- [ ] Add at least one internal tester, verify install
- [ ] Promote to Production when ready
