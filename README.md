# Pro Vets Pressure Washing LLC — Website

A complete, modern redesign of the Pro Vets Pressure Washing LLC website.
Veteran owned and operated pressure washing serving St. Augustine, Mandarin,
Ponte Vedra, Nocatee, Jax Beach and surrounding areas in Northeast Florida.

**Phone / Text:** (904) 533-6762

## Stack

Vanilla HTML, CSS and JavaScript — no build step, no dependencies.
Form submissions are posted straight to the LeadrVision forms endpoint, so there
is no server-side code to deploy.

```
index.html   Entry point — all page sections and structured data
styles.css   Design system, layout and responsive rules
script.js    Mobile nav, scroll reveal, scroll spy, form validation + submit
```

## Running locally

Open `index.html` directly in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Sections

- Hero with business name, tagline and call/estimate CTAs
- Trust strip (veteran owned, equipment, landscape safe, satisfaction guarantee)
- Services — house & soft washing, driveway & concrete, gutters, soffit & fascia,
  sidewalks & walkways, rust/oil/mildew removal
- Before & after gallery of real completed jobs
- About Devante Stamps, Army Infantry veteran and owner
- Customer testimonials
- Service area coverage
- Contact section with phone, text, service area and a free-estimate form

## Lead capture (LeadrVision)

Every form on the site carries the `lead-form` class and submits to:

```
https://vision.leadrai.com/api/forms/747b1309a2ec7b1a4f7b7ef34a790654
```

That URL is set as the form's `action`, so submissions work even with
JavaScript disabled. `script.js` validates the fields and POSTs the same URL
with `fetch()`; on a JSON `{"ok": true}` response the thank-you message replaces
the form inline. A plain HTML submission returns the visitor to the page with
`?submitted=1`, which shows the identical confirmation.

Each form carries three hidden fields:

| Field | Purpose |
| --- | --- |
| `_form` | Short human name for the form, e.g. `Quote request`. |
| `_page` | Set to `window.location.href` on page load so the visitor returns to the right page. |
| `_gotcha` | Hidden honeypot — only bots fill it in. |

Visible fields use human-readable `name` attributes (`First name`, `Last name`,
`What needs cleaning`), with `phone` and `email` named exactly as required.
No credentials or environment variables are needed.

## Notes


- Photography of the owner, equipment and completed jobs is original to the business.
- Accessibility: semantic landmarks, skip link, visible focus rings, labelled form fields
  and `prefers-reduced-motion` support.
