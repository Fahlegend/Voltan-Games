# Product pages and UserTracker

## Run the complete local site

Run `node server.cjs` from this folder, then open http://127.0.0.1:5510/index.html.
This server supports both the website and analytics. Live Server still supports the website, but cannot save analytics.

## Product detail page

Both categories use `Product.html?category=printing&id=your-product-id` (or `category=merch`).
Catalog cards automatically open the detail page. Give each product a unique, permanent `id` so links stay stable as you reorder the catalog. Existing entries without IDs are supported with a position-based fallback; set IDs before publishing products.

Add products to the `printing` or `merch` arrays in ProductData.json:

```json
{
  "id": "desk-organizer",
  "name": "Your product name",
  "description": "A short introduction.",
  "image": "images/3d-printing/organizer-front.jpg",
  "images": [
    { "src": "images/3d-printing/organizer-front.jpg", "alt": "Front view" },
    { "src": "images/3d-printing/organizer-side.jpg", "alt": "Side view" }
  ],
  "price": "R 120.00",
  "originalPrice": "",
  "priceNote": "",
  "availability": "",
  "platform": "MakerWorld",
  "link": "https://makerworld.com/@Voltan_Games",
  "linkLabel": "View on MakerWorld ↗",
  "features": ["Your first product highlight", "Your second highlight"],
  "details": [
    { "heading": "About the design", "text": "Your detailed product description." },
    { "heading": "Care", "text": "Care instructions.", "image": "images/3d-printing/organizer-detail.jpg", "alt": "Design detail" }
  ],
  "specifications": { "Material": "PLA", "Dimensions": "Your actual dimensions" },
  "resources": [{ "label": "View guide", "url": "https://example.com/your-guide" }],
  "tags": ["desk", "organizer"],
  "featured": true
}
```

Prices are display text only. Supply real values for your products. No cart, checkout, payments or customer accounts are included. The platform link on the detail page opens your actual listing; it is not a purchase button. Empty galleries have a fallback, and empty catalogs keep Coming soon!!!.

### Local design previews

The public catalogs remain empty. The two explicitly labeled examples are available only on a local hostname with `preview=1`:

- http://127.0.0.1:5510/Product.html?category=printing&id=desk-stand-preview&preview=1
- http://127.0.0.1:5510/Product.html?category=merch&id=tote-preview&preview=1

ProductPreview.json and images/previews contain layout examples, not real inventory. Preview pages are excluded from analytics. Do not publish these preview files if you do not want the examples available as downloadable assets.

## UserTracker

Open http://127.0.0.1:5510/UserTracker.html. The dashboard is not linked from the public navigation and the server binds only to this computer.

- Tracks page views, viewed homepage sections, product views, gallery interactions, internal and outgoing link clicks, navigation sequences and use of search.
- Search text, form values, names, emails, IP addresses and trading balances are not written to analytics storage.
- An opt-in prompt controls collection. Analytics preferences in the footer lets visitors change their choice. Do Not Track and Global Privacy Control disable collection.
- A random browser identifier estimates visitors; a sessionStorage identifier estimates browser-tab sessions. These are not verified people, and different devices, storage clearing or ad blockers affect counts.
- Section views mean a section crossed the visibility threshold, not proof the visitor read it. Link clicks do not prove a purchase or interest.
- Data persists in `.analytics/events.json`, a folder blocked by the server and excluded from Git. The collector drops unexpected fields and URL queries except product/category identifiers. Event bodies are limited to 4 KB and events per browser are rate-limited.
- Keeps the latest 30 days up to 20,000 events. Dashboard periods are rolling 24 hours / 7 days / 30 days; daily buckets use UTC.
- Refresh the dashboard after browsing. Export report downloads aggregate counts, not visitor identifiers. The dashboard itself is not tracked.

## Before live analytics

This is a functioning local analytics setup, not a deployed analytics service. GitHub Pages serves static files and cannot run server.cjs or store shared visitor events. On GitHub Pages the unavailable collector causes tracking to stay off without breaking the site. A hosted analytics collector and protected owner dashboard must be configured before collecting real site-wide data. Do not expose the local server through a proxy or tunnel; it is intended only for local use. Nothing has been deployed or pushed by this update.

## Checks

Run `node --test tests/analytics.test.cjs` to test storage, aggregation, query removal, request validation, origin protection and blocked private files.
