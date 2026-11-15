# Ron's Pijamas – launch checklist

Launch target: **18.11.2026**. Black Friday: **27.11.2026**.
Last verified: **15.11.2026** against the real Shopify Admin (`h0d0gn-s1.myshopify.com`) and the
real storefront. A task is DONE only when it is verified in Shopify Admin and on the storefront, never
on code alone. Tasks are done strictly in priority order.

Do not change shipping rates, payment settings, policies, default store language, `main` or the LIVE
theme without the owner's explicit approval.

Status: **DONE** / **BLOCKED** (waiting on someone) / **TODO**. Owner: Merchant / Claude / Both.

**Next task:** P0-1. Waiting on the merchant's business details and approval of the legal texts.

---

## P0 – must be finished before publishing

### P0-1 Business details and legally reviewed store policies — BLOCKED · Owner: Both
- **Required action (Merchant):**
  1. Send these details:
     - legal name and legal form;
     - EIK;
     - VAT number, if VAT-registered;
     - registered address;
     - public customer email and phone;
     - return address and who pays return shipping;
     - how refunds are paid;
     - exchange rules.
  2. Have the drafts reviewed by a lawyer.
  3. Approve each text.
- **Required action (Claude, after approval):** prepare the final texts for these Shopify locations:
  - Settings › Policies:
    - Terms of service (Общи условия);
    - Privacy policy (Политика за поверителност);
    - Shipping policy (Доставка и плащане);
    - Refund policy (Връщане и замяна);
    - Contact information (Данни за търговеца).
  - Online Store › Pages: a new page "Политика за бисквитките".

  Then add each link to the footer menus.
- **Dependencies:** P0-2 (the delivery terms go into the shipping policy).
- **Evidence:**
  - Admin, 15.11.2026: only Privacy policy exists, and it's Shopify's auto-generated English text.
  - No terms, shipping, refund or contact-information policies.
  - Settings › Store details: no company name, no phone; contact email is a personal Gmail address.
  - Drafts with [ПОПЪЛНИ] gaps: "Ron’s Pijamas – правни текстове (ЧЕРНОВА)" (claude.ai document).

### P0-2 Shipping thresholds, zones and delivery rules — BLOCKED · Owner: Merchant
- **Required action (Merchant):** in Settings › Shipping and delivery › General profile:
  1. Domestic zone: set the free rate's minimum order price to **€100**, to match the "Безплатна доставка над 100 €" banner.
  2. Re-enter the paid rate in EUR (8.99 BGN ≈ €4.60; your price).
  3. Delete the unused International zone.
  4. Give the courier name and the delivery time.
- **Dependencies:** none.
- **Evidence:**
  - Admin, 15.11.2026: Domestic (BG) has "Стандартна" 8.99 BGN, and "Стандартна" 0.00 BGN when the order is ≥ 70 BGN (≈ €35.79).
  - International zone: 28 countries at €17.
  - Store currency is EUR; the only active market is Bulgaria.
  - Free shipping therefore starts at about €36 today, not €100.
  - No courier or delivery time is configured.

### P0-3 Payments, currency and tax — BLOCKED · Owner: Merchant
- **Required action (Merchant):**
  1. In Settings › Payments, confirm Shopify Payments is activated (identity and payout bank account verified) and test mode is OFF before launch.
  2. Decide on cash on delivery (наложен платеж).
  3. In Settings › Taxes and duties, confirm the Bulgarian VAT setup with your accountant.
- **Dependencies:** P0-1 (VAT number).
- **Evidence:**
  - Admin, 15.11.2026: currency EUR; prices include tax; shipping isn't taxed.
  - The connector has no permission to read the payment account, so payment status is unverified.
  - The storefront shows icons for Visa, Mastercard, Maestro, Amex, UnionPay, Apple Pay, Google Pay and Shop Pay.

### P0-4 Bulgarian storefront and checkout — TODO · Owner: Both
- **Required action (Merchant, after release):**
  1. In Settings › Languages, add Bulgarian, publish it and make it the default language. This makes checkout, emails and the cookie banner Bulgarian.
  2. Rename the Contact page to "Контакти".
  3. Rename the blog "News" to "Блог".
  4. Change the store name to "Ron’s Pijamas".
- **Required action (Claude):** verify `locales/bg.json` on the live theme after the switch.
- **Dependencies:** P0-7 (switch only once the new theme is live; the old theme's `bg.json` is outdated).
- **Evidence:**
  - DEVELOPMENT theme storefront is Bulgarian (audit 15.11.2026).
  - Admin: the only store language is English, so checkout is English: the checkout URL uses `/en-bg/` (test 13.11.2026).
  - Page titles "Contact" and "News" are English.
  - Cookie banner is English.

### P0-5 Primary domain and customer contact information — BLOCKED · Owner: Merchant
- **Required action (Merchant):**
  1. Connect your domain in Settings › Domains and set it as primary.
  2. Set a public customer email (e.g. on your domain) and a phone in Settings › Store details.
- **Dependencies:** none (a domain is needed before the legal texts are final).
- **Evidence:** Admin, 15.11.2026: the primary domain is `h0d0gn-s1.myshopify.com`; no custom domain is connected.

### P0-6 Full end-to-end checkout and order tests — TODO · Owner: Both
- **Required action:** with Shopify Payments in test mode, place test orders:
  - a product with sizes;
  - a single-variant product;
  - an order under and an order over the free-shipping threshold;
  - a discount code.

  Then check the confirmation email, the order in Admin, the inventory change, and a refund. Turn test mode off afterwards.
- **Dependencies:** P0-2, P0-3, P0-4, P0-7.
- **Evidence:** only the redirect to checkout is verified (13.11.2026). No test order has been placed.

### P0-7 Verified development → main release — TODO · Owner: Both
- **Required action:**
  1. The owner approves the release.
  2. Claude opens and merges the PR `development` → `main`.
  3. Claude verifies that the theme "rons-pijamas-theme/main" matches `main` (checksums).
  4. The merchant publishes "rons-pijamas-theme/main" in Online Store › Themes. The connector lacks publish permission.
- **Dependencies:** P0-1 and P0-2 should be done first; the footer links need the policies.
- **Evidence (15.11.2026):**
  - `main` lacks 5 commits that are on `development`: the new footer, cookie link, newsletter consent and size-guide page (`d974548`, `579a893`, `613365a`, `f515de3`, `e444a3e`).
  - DEVELOPMENT theme = `e444a3e`, verified by checksum.
  - LIVE is still the old theme `claude/size-guide-system`.

### P0-8 Inventory and product availability — BLOCKED · Owner: Merchant
- **Required action (Merchant):**
  1. Turn on inventory tracking and enter real stock for every product.
  2. Add the real sizes to "Celeste", "Casa Blanca", "Dots 2" and the nightdress "Midnight Safari"; each currently has a single variant, so customers can't choose a size.
- **Dependencies:** none.
- **Evidence:**
  - Admin, 15.11.2026: 6 active products.
  - Only "Халат Midnight Safari" tracks inventory (7 units, 4 sizes).
  - Boho Breeze (3 sizes) and the other 4 products don't track inventory, so they can be sold without limit.

---

## P1 – strongly recommended for conversion

| Task | Status | Owner | Required action | Dependencies | Evidence |
|---|---|---|---|---|---|
| High-resolution product photos | BLOCKED | Merchant | Upload photos at least 1500 px wide | – | Existing product photos are about 145 px wide (earlier audit) |
| Descriptions, materials, care | TODO | Merchant | Material, composition and care for each product; Claude checks after | – | Not audited yet |
| Mobile UX and Quick Add | TODO | Claude | Release with P0-7, then re-test on LIVE | P0-7 | DEVELOPMENT preview, 13.11.2026: hover, sizes, exact variant, errors, 390/768/1440 passed; sold-out size untested (no sold-out stock) |
| Verified reviews and trust claims | BLOCKED | Merchant | Confirm "5.0 / 5", "5000+ доволни клиентки", "Изпращане до 24 часа", the reviews section and the follower count "10,2K", or remove them | – | Shown on the DEVELOPMENT homepage; no evidence supplied |
| GA4 and Meta Pixel purchase tracking | TODO | Both | Connect via the Google & YouTube and Facebook & Instagram channels; test a purchase event | P0-6 | 15.11.2026: no GA4 or Meta requests on the storefront |
| Email notifications and abandoned checkout | TODO | Both | Check order and shipping emails (Bulgarian after P0-4) and turn on the abandoned checkout email (Marketing › Automations) | P0-4 | Not verified |

## P2 – Black Friday (27.11.2026)

| Task | Status | Owner | Required action | Dependencies | Evidence |
|---|---|---|---|---|---|
| Discount strategy and eligible products | TODO | Merchant | Choose the products and discount | P0-8 | – |
| Black Friday landing page or banner | TODO | Claude | Build with existing sections once the offer is final | Discount strategy | – |
| Compare-at prices and discount compliance | TODO | Both | Compare-at price = the real lowest price of the last 30 days (Bulgarian consumer protection rules) | Discount strategy | Several products already show compare-at prices; their history isn't verified |
| Meta campaign tracking and audiences | TODO | Merchant | Pixel and Conversions API, audiences | P1 tracking | – |
| Email campaign | TODO | Merchant | Shopify Email campaign to subscribers | P0-4 | – |
| Creative assets | TODO | Merchant | Banners and ads | Discount strategy | – |
| Campaign performance dashboard | TODO | Both | Shopify Analytics report and GA4 | P1 tracking | – |

## P3 – after launch

| Task | Status | Owner | Required action | Dependencies | Evidence |
|---|---|---|---|---|---|
| About Us photography | TODO | Merchant | Photos for the 7 За нас sections | – | Placeholders in DEVELOPMENT |
| Instagram feed layout | TODO | Merchant | Instafeed app: 6 posts, 1 row, mobile slider | – | The app still shows its default slider |
| Animation and styling | TODO | Claude | Only after P0–P2 | – | – |
| Blog expansion | TODO | Merchant | Articles | – | – |
