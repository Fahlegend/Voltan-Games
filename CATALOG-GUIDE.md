# Adding products and images

Edit ProductData.json. Keep printing and merch as arrays. Empty arrays display Coming soon!!! automatically.

Add an entry inside either array using this structure (replace the example with your real product):

```json
{
  "name": "Your product name",
  "description": "A short description, materials and dimensions.",
  "image": "images/3d-printing/your-product.jpg",
  "price": "",
  "link": "",
  "linkLabel": "View on MakerWorld ↗",
  "tags": ["desk", "organizer"]
}
```

Put 3D printing photos in images/3d-printing and merchandise photos in images/merch. Use forward slashes in JSON paths. JPG, PNG, WebP and GIF images work. An empty or broken image displays an Image coming soon placeholder. Products open the shared product-detail page. An empty platform link displays Platform link coming soon there. Add your actual product or listing URL when ready.

The single Home top-bar search includes every catalog. Dedicated collection pages each have one category search. Names, descriptions, tags and category names are searchable. Prices are optional display text; the website does not process orders.

Game images live in images/games/<game folder>/ and are referenced in GameData.json and DynamicGameData.json. Original root images have been kept as backups. Game details and existing social/about content remain in their original data files.

Run with your existing Live Server and open index.html. Saving files refreshes the live view.

## Featured homepage and collection pages
The homepage displays up to three items per catalog. Set featured to true on an item to prioritize it; otherwise the first three entries are shown. Games, printing, and merch each have their own HTML page with a scoped search in the fixed top bar. Home's top-bar search opens catalog.html and searches all categories. Empty product catalogs keep the Coming soon!!! message.

See PRODUCT-AND-ANALYTICS-GUIDE.md for gallery images, product detail fields, local previews and visitor analytics.

