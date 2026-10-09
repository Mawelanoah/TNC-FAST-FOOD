# TNC Fast Food – Upgraded Website

Professional online menu + WhatsApp ordering for **TNC Fast Food** (Soshanguve).

**Live site (after you push):** https://mawelanoah.github.io/TNC-FAST-FOOD/

## What was improved

- Professional dark design (red / black / white) optimised for Android phones
- Clear homepage: “Big Flavour. Small Prices.” + starting price + Order / View Menu buttons
- Sticky category navigation (Magwinya, Kotas, Chips, Add-ons, Weekend)
- Real menu prices preserved from your existing site
- Mercedes-Benz Kota kept at **R40** and flagged “Confirm price” (check against printed menu)
- Weekend note: available with pap & salad
- Full cart: +/− quantities, remove, running total
- Checkout: name, phone, collection time, special instructions
- Clean WhatsApp message to **084 017 1408** (international format 27840171408)
- Open/Closed status based on 07:30–18:00
- “Why Choose TNC”, food gallery, collection-only notice, Google Maps links
- Floating WhatsApp button + fixed cart bar
- Single static HTML file – works on GitHub Pages with no backend

## Files to upload

Replace these in your existing GitHub repo `Mawelanoah/TNC-FAST-FOOD`:

| File | Action |
|------|--------|
| `index.html` | **Replace** with the new version |
| `assets/` | Keep your existing images (logo.png, kota photos, chips, etc.) |
| `script.js` / `style.css` | Optional – no longer required (everything is inside `index.html`) |

## How to upload to GitHub

### Option A – GitHub website
1. Go to https://github.com/Mawelanoah/TNC-FAST-FOOD
2. Open `index.html` → click the pencil (Edit)
3. Delete all content and paste the new `index.html` content
4. Commit changes (message e.g. “Upgrade to professional ordering site”)
5. Wait 1–2 minutes, then refresh https://mawelanoah.github.io/TNC-FAST-FOOD/

### Option B – Git command line
```bash
git clone https://github.com/Mawelanoah/TNC-FAST-FOOD.git
cd TNC-FAST-FOOD
# Copy the new index.html over the old one
git add index.html
git commit -m "Upgrade to professional WhatsApp ordering website"
git push
```

## Business details still to confirm with the owner

1. **Mercedes-Benz Kota price** – currently R40 on the website. Confirm against the printed menu.
2. **Opening hours** – currently 07:30–18:00 every day. Confirm if they change.
3. **Weekend chicken** – confirm when “weekend” items are actually available and whether pap & salad is always an option.
4. Any extra items on the printed menu that were not clearly readable (do not invent prices).

## Editing prices later

All products are in the HTML with `data-name` and `data-price`.  
Change the number in `data-price="40"` and the visible `R40` text to update a price.

Opening hours and WhatsApp number are at the top of the `<script>` section in a `CONFIG` object.
