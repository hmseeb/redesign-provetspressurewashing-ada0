/* =========================================================
   Pro Vets Pressure Washing LLC — website lead handler
   Creates / updates a contact in the GoHighLevel sub-account
   and tags it so every website form lands in the CRM.

   Required environment variable (set in the hosting dashboard,
   never committed to the repo):
     GHL_API_TOKEN   Private Integration token for the location
                     with contacts.write / contacts.readonly and
                     locations/customFields scopes.

   Optional:
     GHL_LOCATION_ID Overrides the default sub-account id below.
   ========================================================= */
'use strict';

var GHL_API = 'https://services.leadconnectorhq.com';
var GHL_VERSION = '2021-07-28';
var DEFAULT_LOCATION_ID = '60mqvUeI3AjQBxVF6rgY';

var LEAD_SOURCE_FIELD = 'Lead Source';
var WEBSITE_FORM_FIELD = 'Website Form';
var MESSAGE_FIELD = 'Message';
var LEAD_TAG = 'website-lead';

/* Custom field ids are stable per location — cache them for the
   lifetime of the warm serverless instance. */
var fieldCache = null;

function token() {
  return (
    process.env.GHL_API_TOKEN ||
    process.env.GHL_PRIVATE_INTEGRATION_TOKEN ||
    process.env.GHL_API_KEY ||
    ''
  ).trim();
}

function locationId() {
  return (process.env.GHL_LOCATION_ID || DEFAULT_LOCATION_ID).trim();
}

function headers() {
  return {
    Authorization: 'Bearer ' + token(),
    Version: GHL_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };
}

function str(value, max) {
  if (value === undefined || value === null) return '';
  return String(value).trim().slice(0, max || 500);
}

/* Loose comparison so "Lead Source", "lead_source" and
   "contact.lead_source" all resolve to the same field. */
function norm(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function splitName(first, last, full) {
  var f = str(first, 80);
  var l = str(last, 80);
  if (f || l) return { firstName: f, lastName: l };

  var parts = str(full, 160).split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: '', lastName: '' };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

/* GoHighLevel matches existing contacts best on E.164 numbers. */
function normalizePhone(raw) {
  var value = str(raw, 40);
  if (!value) return '';
  if (/^\+/.test(value)) return '+' + value.slice(1).replace(/\D/g, '');

  var digits = value.replace(/\D/g, '');
  if (digits.length === 10) return '+1' + digits;
  if (digits.length === 11 && digits.charAt(0) === '1') return '+' + digits;
  return digits ? '+' + digits : '';
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

async function ghl(path, options) {
  var res = await fetch(GHL_API + path, Object.assign({ headers: headers() }, options));
  var text = await res.text();
  var body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch (err) {
    body = { raw: text };
  }
  return { ok: res.ok, status: res.status, body: body };
}

/* Look up the location's contact custom fields, creating the two
   fields this integration relies on if they don't exist yet. */
async function resolveCustomFields() {
  if (fieldCache) return fieldCache;

  var map = {};
  var res = await ghl('/locations/' + locationId() + '/customFields?model=contact', { method: 'GET' });

  if (res.ok && res.body) {
    var existing = res.body.customFields || res.body.customField || [];
    existing.forEach(function (field) {
      if (!field || !field.id) return;
      map[norm(field.name)] = field.id;
      if (field.fieldKey) {
        map[norm(String(field.fieldKey).split('.').pop())] = field.id;
      }
    });
  }

  var wanted = [LEAD_SOURCE_FIELD, WEBSITE_FORM_FIELD, MESSAGE_FIELD];
  for (var i = 0; i < wanted.length; i++) {
    var name = wanted[i];
    if (map[norm(name)]) continue;

    /* Best effort — if the token can't create fields we simply
       carry on and still upsert the contact and its tag. */
    var created = await ghl('/locations/' + locationId() + '/customFields', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        dataType: name === MESSAGE_FIELD ? 'LARGE_TEXT' : 'TEXT',
        model: 'contact',
        placeholder: name
      })
    });

    var field = created.body && (created.body.customField || created.body.customFields);
    if (created.ok && field && field.id) map[norm(name)] = field.id;
  }

  fieldCache = map;
  return map;
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, OPTIONS');
    return res.status(405).json({ ok: false, error: 'Method not allowed.' });
  }

  var data = req.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch (err) {
      data = null;
    }
  }
  if (!data || typeof data !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid request body.' });
  }

  /* Honeypot — bots fill hidden fields, humans never do. */
  if (str(data.company, 200)) {
    return res.status(200).json({ ok: true });
  }

  var name = splitName(data.firstName, data.lastName, data.name);
  var email = str(data.email, 190).toLowerCase();
  var phone = normalizePhone(data.phone);
  var message = str(data.message, 4000);
  var formName = str(data.formName, 120) || 'Website Form';

  if (!name.firstName) {
    return res.status(400).json({ ok: false, error: 'Please enter your first name.' });
  }
  if (!email && !phone) {
    return res.status(400).json({ ok: false, error: 'Please enter an email address or phone number.' });
  }
  if (email && !isEmail(email)) {
    return res.status(400).json({ ok: false, error: 'Please enter a valid email address.' });
  }

  if (!token()) {
    console.error('[lead] GHL_API_TOKEN is not configured — cannot sync lead to GoHighLevel.');
    return res.status(503).json({
      ok: false,
      error: 'Our form is temporarily unavailable. Please call or text (904) 533-6762.'
    });
  }

  try {
    var fields = await resolveCustomFields();
    var customFields = [];

    function pushField(fieldName, value) {
      var id = fields[norm(fieldName)];
      if (id && value) customFields.push({ id: id, field_value: value });
    }

    pushField(LEAD_SOURCE_FIELD, 'Website');
    pushField(WEBSITE_FORM_FIELD, formName);
    pushField(MESSAGE_FIELD, message);

    var payload = {
      locationId: locationId(),
      firstName: name.firstName,
      source: 'Website',
      tags: [LEAD_TAG]
    };
    if (name.lastName) payload.lastName = name.lastName;
    if (email) payload.email = email;
    if (phone) payload.phone = phone;
    if (customFields.length) payload.customFields = customFields;

    var upsert = await ghl('/contacts/upsert', {
      method: 'POST',
      body: JSON.stringify(payload)
    });

    if (!upsert.ok) {
      console.error('[lead] GoHighLevel upsert failed', upsert.status, JSON.stringify(upsert.body));
      return res.status(502).json({
        ok: false,
        error: 'We could not submit your request. Please call or text (904) 533-6762.'
      });
    }

    var contact = (upsert.body && (upsert.body.contact || upsert.body)) || {};
    var contactId = contact.id || contact.contactId;

    /* Keep the full message readable in the CRM timeline too.
       Non-fatal: the lead is already saved at this point. */
    if (contactId && message) {
      var note = await ghl('/contacts/' + contactId + '/notes', {
        method: 'POST',
        body: JSON.stringify({ body: formName + ' — website submission:\n\n' + message })
      });
      if (!note.ok) {
        console.warn('[lead] Note not created', note.status, JSON.stringify(note.body));
      }
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[lead] Unexpected error', err && err.message);
    return res.status(502).json({
      ok: false,
      error: 'We could not submit your request. Please call or text (904) 533-6762.'
    });
  }
};
