# Content guide — Timeless Objects

How to add, hide, and publish content without a CMS. Edit files locally (or in Cursor), push to `main`, and the site updates via GitHub Pages.

## Quick workflow

1. Edit `data/objects.json` and/or `data/creators.json`
2. Add images to `images/objects/`
3. Run `node scripts/build-seo.js` (updates sitemap + robots.txt)
4. Commit and push

Cursor can do all of this for you — e.g. *"Add Braun SK5 to audio, here's the copy and images"*.

---

## Launching with less content

You don't need every entry live on day one.

**Hide an item** (keep it in JSON for later):

```json
"published": false
```

Unpublished items won't appear in the catalog, detail pages return 404, and they're excluded from the sitemap.

**Show an item:** remove `"published": false` or set `"published": true`.

**Featured hero:** exactly one object should have `"featured": true` for the home intro screen.

---

## Object fields

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | yes | URL-safe id, e.g. `cp2-instant-disk-audio` |
| `name` | yes | Display title |
| `brand` | yes | Maker or label |
| `category` | yes | Must match a category in `nav.js` (see below) |
| `listingImage` | yes | Square-ish thumbnail for the grid |
| `detailImage` | no | Large hero on detail page; falls back to `listingImage` |
| `description` | no | Plain text; separate paragraphs with a blank line |
| `externalUrl` | no | Link to buy or learn more |
| `availability` | no | e.g. `"buyable"` |
| `featured` | no | `true` for the home hero object |
| `published` | no | `false` to hide without deleting |

### Example

```json
{
  "slug": "cp2-instant-disk-audio",
  "name": "CP2",
  "brand": "KM5",
  "category": "audio",
  "externalUrl": "https://example.com/product",
  "availability": "buyable",
  "featured": true,
  "description": "First paragraph.\n\nSecond paragraph.",
  "listingImage": "images/objects/cp2.webp",
  "detailImage": "images/objects/cp2_detail.webp"
}
```

---

## Creator fields

Creators live in `data/creators.json`. Same idea — `slug`, `name`, `discipline` (instead of brand), `category`, images, `description`, `externalUrl`, `published`.

Detail URL: `detail.html?slug=…&type=creator`

---

## Categories

Categories are defined in **`nav.js`** (`LEFT_FILTERS`). An object's `category` value must match one of these:

| Value | Nav label |
|-------|-----------|
| `furniture` | Furniture |
| `audio` | Audio |
| `studio` | Workspace |
| `gaming` | Gaming |
| `collectable` | Collectable |
| `fashion` | Fashion |

**Note:** `data/objects.json` also contains `tech` and `cars` items, but those categories aren't in the nav yet. Add them to `nav.js` when you're ready to expose them:

```js
{ type: "category", value: "tech", label: "Tech" },
{ type: "category", value: "cars", label: "Cars" },
```

---

## Images

| Use | Path | Suggested size |
|-----|------|----------------|
| Grid thumbnail | `images/objects/name.webp` | ~800–1200px square |
| Detail hero | `images/objects/name-detail.webp` | ~1500px wide |
| Social share card | `images/share/og-default.webp` | 1200×630px (replace before launch) |

- Prefer **WebP** for photos
- Use short, lowercase, hyphenated filenames
- After adding a new detail image, add its dimensions to `DETAIL_IMAGE_DIMENSIONS` in `detail.js` (prevents layout shift on first load)

---

## Site config & domain

Global settings live in **`config/site.json`**:

- `origin` — full site URL (no trailing slash)
- `name`, `description`, `tagline` — used for SEO and share previews
- `ogImage` — default image when links are shared

### Switching to a new domain

1. Buy/configure DNS for the new domain
2. Update **`CNAME`** with the new domain
3. Update **`config/site.json`** → `"origin": "https://yourdomain.com"`
4. Find-replace the old domain in HTML files (`index.html`, `about.html`, `detail.html`, `terms.html`, `privacy.html`)
5. Update domain references in `terms.html` body copy
6. Run `node scripts/build-seo.js`
7. Enable HTTPS in GitHub → Settings → Pages

---

## SEO & sharing

**Before each content push:**

```bash
node scripts/build-seo.js
```

This regenerates `sitemap.xml` (all published objects + creators + static pages) and `robots.txt`.

**Share preview image:** replace `images/share/og-default.webp` with a branded 1200×630 card. Used when the site is shared on iMessage, Slack, X, etc.

**Detail page shares:** `detail.html` has a default share card in HTML. When JavaScript runs, it updates title/description/image per object. Some crawlers don't run JS — for perfect per-object link previews later, consider static detail pages or a build step.

**Structured data:** `index.html` and `about.html` include JSON-LD for search engines.

---

## Static pages

| Page | File |
|------|------|
| Home / catalog | `index.html` |
| About | `about.html` |
| Terms | `terms.html` |
| Privacy | `privacy.html` |

About copy is in `about.html` directly (not JSON).

---

## Checklist — new object

- [ ] Images exported to `images/objects/`
- [ ] Entry added to `data/objects.json`
- [ ] `slug` is unique and URL-safe
- [ ] `category` matches `nav.js`
- [ ] Detail image dimensions added to `detail.js` if new detail image
- [ ] `node scripts/build-seo.js` run
- [ ] Spot-check catalog grid + detail page locally
- [ ] Commit and push

---

## Checklist — go live

- [ ] New domain in `CNAME` + `config/site.json`
- [ ] All old domain references updated
- [ ] Custom share image at `images/share/og-default.webp`
- [ ] Unwanted items set to `"published": false`
- [ ] One `featured` object with good copy + images
- [ ] About page copy reviewed
- [ ] Sitemap regenerated and pushed
