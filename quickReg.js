// quickreg.js  ───────────────────────────────────────────────────────────────
// npm  i  node-fetch@3  cheerio
// ---------------------------------------------------------------------------

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

// ‣ ENDPOINTS ---------------------------------------------------------------
const QUICKREG_URL =
  'https://klinikkenanga.dyndns.org/admins/quickreg.php?i=WzIsInh4eHh4eHh4Il0=';
const QR_RECEIVE_URL =
  'https://klinikkenanga.dyndns.org/admins/qr_receive.php';

// ‣ UTILITIES ---------------------------------------------------------------

/**
 * Normalise anything the user passes (raw header, pair, or bare id)
 * into "PHPSESSID=xxxxxxxx". Returns null when nothing supplied.
 */
function cleanPhpSess(cookieInput = '') {
  const trimmed = cookieInput.trim();
  if (!trimmed) return null; // nothing supplied

  // bare session id?
  if (/^[0-9a-f]{26,128}$/i.test(trimmed)) return `PHPSESSID=${trimmed}`;

  // header or key-value pair?
  const m = trimmed.match(/PHPSESSID=([^;]+)/i);
  if (m) return `PHPSESSID=${m[1]}`;

  throw new Error('No PHPSESSID found in --cookie / env value');
}

/** Basic argv → { key: value } helper */
function parseArgs() {
  const out = {};
  process.argv.slice(3).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const val =
        arr[i + 1] && !arr[i + 1].startsWith('--') ? arr[i + 1] : true;
      out[key] = val;
    }
  });
  return out;
}

// ‣ CORE HELPERS ------------------------------------------------------------

/**
 * Helper to get a new PHPSESSID by making a GET request to the quickreg page.
 * @returns {Promise<string|null>} Clean "PHPSESSID=..." string or null
 */
async function getNewSessionCookie() {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
  };
  const res = await fetch(QUICKREG_URL, { method: 'GET', headers });
  const setCookie = res.headers.get('set-cookie');
  const match = setCookie && setCookie.match(/PHPSESSID=([^;]+)/);
  return match ? `PHPSESSID=${match[1]}` : null;
}

/**
 * GETs the quick-registration page to extract the hidden CSRF token.
 *
 * @param {string|null} sessionCookie  Clean "PHPSESSID=…" string or null
 * @returns {Promise<string>}
 */
export async function fetchCsrfToken(sessionCookie) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'accept-language': 'en-US,en;q=0.9',
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
  };
  if (sessionCookie) headers.Cookie = sessionCookie;

  const res = await fetch(QUICKREG_URL, { method: 'GET', headers });
  if (!res.ok)
    throw new Error(`quickreg GET failed: ${res.status} ${res.statusText}`);

  const $ = cheerio.load(await res.text());
  const token = $('#csrftoken').attr('value');
  if (!token) throw new Error('CSRF token not found');
  return token;
}

/**
 * Posts the registration form using a fresh CSRF token.
 *
 * @param {object}  data           All form fields except csrftoken
 * @param {string|null} sessionCookie  Clean "PHPSESSID=…" or null
 * @returns {Promise<string|object>}   Raw text or parsed JSON
 */
export async function submitQuickReg(data, sessionCookie) {
  const csrftoken = await fetchCsrfToken(sessionCookie);
  const params = new URLSearchParams({ ...data, csrftoken });

  const headers = {
    'accept': '*/*',
    'accept-language': 'en-US,en;q=0.9',
    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'sec-ch-ua': '"Google Chrome";v="137", "Chromium";v="137", "Not/A)Brand";v="24"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'x-requested-with': 'XMLHttpRequest',
    'Referer': QUICKREG_URL,
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
  };
  if (sessionCookie) headers.Cookie = sessionCookie;

  const postRes = await fetch(QR_RECEIVE_URL, {
    method: 'POST',
    headers,
    body: params,
  });

  if (!postRes.ok)
    throw new Error(
      `qr_receive POST failed: ${postRes.status} ${postRes.statusText}`
    );

  return postRes.headers.get('content-type')?.includes('json')
    ? await postRes.json()
    : await postRes.text();
}

/**
 * Helper function to submit a quick registration with formatted appointment reason.
 * @param {Object} options - Registration data
 * @param {string} options.name - Patient name
 * @param {string} options.nric - NRIC number
 * @param {string} options.tel - Phone number
 * @param {string} options.dob - Date of birth (DD/MM/YYYY)
 * @param {string} options.sex - Gender ('m' or 'f')
 * @param {string} options.email - Email address
 * @param {string} options.alamat - Address
 * @param {string} options.doctor - Doctor name
 * @param {string} options.time - Appointment time
 * @param {string} options.date - Appointment date
 * @param {string} options.remarks - Optional remarks
 * @param {string|null} options.sessionCookie - Optional session cookie
 * @returns {Promise<string|object>} Server reply
 */
export async function quickRegister({
  name,
  nric,
  tel,
  dob,
  sex,
  email,
  alamat,
  doctor,
  time,
  date,
  remarks,
  sessionCookie = null
}) {
  // Format the appointment reason
  let reasv = `Appointment with Dr. ${doctor} at ${time} on ${date}`;
  if (remarks) {
    reasv += `\n${remarks}`;
  }
  
  const formData = {
    qrid: '2',
    gname: 'Klinik Kenanga',
    name,
    nric,
    tel,
    dob,
    sex,
    email,
    alamat,
    reasv,
  };

  // If no session cookie provided, obtain one
  if (!sessionCookie) {
    console.log('→ No session cookie provided, obtaining new PHPSESSID...');
    sessionCookie = await getNewSessionCookie();
    if (sessionCookie) {
      console.log('✓ Obtained session cookie:', sessionCookie);
    } else {
      console.warn('✗ Could not obtain PHPSESSID from server.');
    }
  }

  console.log(`→ Submitting quick-reg (${sessionCookie ? 'with' : 'without'} cookie)…`);
  const reply = await submitQuickReg(formData, sessionCookie);
  console.log('✓ Server replied:\n', reply);
  
  return reply;
}

// ‣ CLI:  node quickreg.js test [options] ------------------------------------

async function runTest() {
  const argv = parseArgs();

  let rawCookie =
    argv.cookie ||
    argv.session || // legacy flag still accepted
    process.env.PHPSESSID || // just the id
    process.env.COOKIE || ''; // whole header

  let sessionCookie = cleanPhpSess(rawCookie); // may be null

  // If no session cookie, obtain one programmatically
  if (!sessionCookie) {
    console.log('→ No session cookie provided, obtaining new PHPSESSID...');
    sessionCookie = await getNewSessionCookie();
    if (sessionCookie) {
      console.log('✓ Obtained session cookie:', sessionCookie);
    } else {
      console.warn('✗ Could not obtain PHPSESSID from server.');
    }
  }

  // Default demo data • override any field via CLI flags
  const formData = {
    qrid: '2',
    gname: 'Klinik Kenanga',
    name: argv.name || 'Bryan Kek Kit Hun',
    nric: argv.nric || '911117055345',
    tel: argv.tel || '0166400438',
    dob: argv.dob || '08/05/1962',
    sex: argv.sex || 'm',
    email: argv.email || 'bryankek@gmail.com',
    alamat:
      argv.alamat ||
      '31, Jalan Oz 16\r\nTaman Ozana Impian',
    reasv:
      argv.reasv ||
      'Appointment Dr Bryan 9am Sunday',
  };

  console.log(
    `→ Submitting quick-reg (${sessionCookie ? 'with' : 'without'} cookie)…`
  );
  const reply = await submitQuickReg(formData, sessionCookie);
  console.log('✓ Server replied:\n', reply);
}

// entry point
if (process.argv[1] && import.meta.url.replace('file://', '').endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const [cmd] = process.argv.slice(2);
  if (cmd === 'test') {
    runTest().catch((err) => {
      console.error('✗ Error:', err.message);
      process.exit(1);
    });
  } else {
    console.log(`quickreg.js  –  CLI

Usage:
  node quickreg.js test [--cookie "PHPSESSID=..."] [--name "..."] [--nric ...] [...]

  --cookie / --session   Raw "Cookie:" header, "PHPSESSID=...", or bare id
  Other flags override the demo form fields (see script).
  
Examples:
  node quickreg.js test
  node quickreg.js test --cookie cgtqah7kenm3gi0k9rdnatibmd --name "Jane Doe"
`);
  }
}
