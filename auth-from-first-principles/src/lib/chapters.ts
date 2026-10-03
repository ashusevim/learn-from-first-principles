export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Identity Foundations',
  'Part II — Tokens',
  'Part III — Delegation',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-auth',
    order: 1,
    title: 'What Is Auth, Really?',
    blurb:
      'Authentication (who are you) vs authorization (what may you do) — two promises, constantly conflated. Build: the naive password check and its three holes.',
    part: 'Part I — Identity Foundations',
    written: true,
  },
  {
    slug: '02-password-storage',
    order: 2,
    title: 'Password Storage Done Right',
    blurb:
      'The cryptography course’s Chapter 3, applied: salts, slow KDFs, and the login loop. Build: register + login with PBKDF2.',
    part: 'Part I — Identity Foundations',
    written: true,
  },
  {
    slug: '03-sessions',
    order: 3,
    title: 'Sessions: The Server Remembers',
    blurb:
      'The stateful model: a random token, a server-side store, expiry. Build: login → session token → authenticated request → logout.',
    part: 'Part I — Identity Foundations',
    written: true,
  },
  {
    slug: '04-cookies',
    order: 4,
    title: 'Cookies & the Browser Contract',
    blurb:
      'How the token travels: Set-Cookie, HttpOnly, Secure, SameSite. Build: a cookie jar that demonstrates every attribute.',
    part: 'Part II — Tokens',
    written: true,
  },
  {
    slug: '05-jwt-from-scratch',
    order: 5,
    title: 'JWT: Signed Claims',
    blurb:
      'The stateless model: claims signed with HMAC. Build: JWT header.payload.signature from scratch — verify, tamper, detect.',
    part: 'Part II — Tokens',
    written: true,
  },
  {
    slug: '06-jwt-pitfalls',
    order: 6,
    title: 'JWT Pitfalls: alg=none & the Confusion Attacks',
    blurb:
      'The signature checks the ALGORITHM — from the attacker-controlled header. Build: the alg=none and RS256/HMAC confusion breaks.',
    part: 'Part II — Tokens',
    written: true,
  },
  {
    slug: '07-oauth2',
    order: 7,
    title: 'OAuth 2.0: The Delegation Problem',
    blurb:
      '“Let this app access my data” without sharing your password. Build: the authorization code flow, step by step.',
    part: 'Part III — Delegation',
    written: true,
  },
  {
    slug: '08-openid-connect',
    order: 8,
    title: 'OpenID Connect: Who Are You?',
    blurb:
      'OAuth says what you may access; OIDC says who you are. Build: an ID token decoded, claims verified.',
    part: 'Part III — Delegation',
    written: true,
  },
  {
    slug: '09-api-keys',
    order: 9,
    title: 'API Keys & Machine Identity',
    blurb:
      'Machines authenticate too — keys, scopes, and rotation. Build: key generation with prefixes and hashed storage.',
    part: 'Part III — Delegation',
    written: true,
  },
  {
    slug: '10-tls-the-channel',
    order: 10,
    title: 'TLS: Auth Without the Channel Is Theater',
    blurb:
      'Every token in this course travels over TLS (the cryptography course, Chapter 11). Build: why http:// auth is theater.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-attack-catalog',
    order: 11,
    title: 'The Attack Catalog: CSRF, XSS, Fixation & Stuffing',
    blurb:
      'Four classic auth attacks, each mapped to the defense that kills it. Build: each attack staged against the naive system, then blocked.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-auth-system',
    order: 12,
    title: 'Final Boss: A Complete Auth System in ~300 Lines',
    blurb:
      'Register, login, sessions, logout, protected routes — every defense from the course composed into one file.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Identity on One Page',
    blurb:
      'Authentication, sessions, tokens and delegation on one page — the model, the checks you must never skip, and the pitfalls with their chapters.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the auth system from Chapter 12 — hashing, sessions, JWT attacks, OAuth. Each is checkable by you alone.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
];

export function chapterBySlug(slug: string): ChapterMeta | undefined {
  return CHAPTERS.find((c) => c.slug === slug);
}

export function chapterNeighbors(slug: string) {
  const i = CHAPTERS.findIndex((c) => c.slug === slug);
  return {
    prev: i > 0 ? CHAPTERS[i - 1] : undefined,
    next: i >= 0 && i < CHAPTERS.length - 1 ? CHAPTERS[i + 1] : undefined,
  };
}
