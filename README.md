# Pro Vets Pressure Washing LLC — Website

A complete, modern redesign of the Pro Vets Pressure Washing LLC website.
Veteran owned and operated pressure washing serving St. Johns, Mandarin, St. Augustine,
Ponte Vedra, Nocatee, Jax Beach and surrounding areas in Northeast Florida.

**Phone / Text:** (904) 533-6762

## Stack

Vanilla HTML, CSS and JavaScript — no build step, no dependencies, no external APIs.

```
index.html   Entry point — all page sections and structured data
styles.css   Design system, layout and responsive rules
script.js    Mobile nav, scroll reveal, scroll spy, form validation
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

## Notes

- The estimate form is client-side only: it validates input and then hands the details
  off to the customer's SMS app pre-addressed to the business number. No data is stored
  and no third-party service is contacted.
- Photography of the owner, equipment and completed jobs is original to the business.
- Accessibility: semantic landmarks, skip link, visible focus rings, labelled form fields
  and `prefers-reduced-motion` support.
