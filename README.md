# Pro Vets Pressure Washing LLC — Website

A complete, modern redesign of the Pro Vets Pressure Washing LLC website.
Veteran owned and operated pressure washing serving St. Augustine, Mandarin,
Ponte Vedra, Nocatee, Jax Beach and surrounding areas in Northeast Florida.

**Phone / Text:** (904) 533-6762

## Stack

Vanilla HTML, CSS and JavaScript — no build step, no dependencies.
Form submissions are relayed to GoHighLevel by a single serverless function.

```
index.html   Entry point — all page sections and structured data
styles.css   Design system, layout and responsive rules
script.js    Mobile nav, scroll reveal, scroll spy, form validation + submit
api/lead.js  Serverless endpoint — syncs form submissions to GoHighLevel
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

## Lead capture (GoHighLevel)

Every form on the site carries the `lead-form` class and posts to `/api/lead`.
That endpoint creates or updates the contact in the GoHighLevel sub-account
(location `60mqvUeI3AjQBxVF6rgY`) with first name, last name, phone, email and
the message, sets the custom fields **Lead Source** → `Website` and
**Website Form** → the submitting form's name, and applies the **`website-lead`**
tag. The message is also written to the contact's notes timeline. A thank-you
message replaces the form once the submission succeeds.

The API token is never stored in the repo — set it as an environment variable in
the hosting dashboard:

| Variable | Required | Purpose |
| --- | --- | --- |
| `GHL_API_TOKEN` | yes | Private Integration token for the location. Needs the `contacts.write`, `contacts.readonly` and custom-field scopes. |
| `GHL_LOCATION_ID` | no | Overrides the default location id. |

Without `GHL_API_TOKEN` the endpoint returns a friendly error pointing visitors
to the phone number rather than silently dropping the lead.

## Notes


- Photography of the owner, equipment and completed jobs is original to the business.
- Accessibility: semantic landmarks, skip link, visible focus rings, labelled form fields
  and `prefers-reduced-motion` support.
