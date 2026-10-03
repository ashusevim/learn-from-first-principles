export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Foundations',
  'Part II — Secret-Key Cryptography',
  'Part III — Public-Key Cryptography',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-cryptography',
    order: 1,
    title: 'What Is Cryptography, Really?',
    blurb:
      'Three promises — secrecy, integrity, authenticity — and the Caesar cipher that delivers none of them. Build: a cipher and its frequency-analysis break.',
    part: 'Part I — Foundations',
    written: true,
  },
  {
    slug: '02-hashes-one-way-functions',
    order: 2,
    title: 'Hashes: One-Way Functions',
    blurb:
      'Avalanche, preimage resistance, commitments — why hashing isn’t encryption. Build: a hash commitment you can’t reneg on.',
    part: 'Part I — Foundations',
    written: true,
  },
  {
    slug: '03-entropy-passwords-kdf',
    order: 3,
    title: 'Entropy, Passwords & Key Derivation',
    blurb:
      'Why human passwords are weak keys, what salts fix (and don’t), and why slow hashing is a feature. Build: a dictionary attack, then PBKDF2.',
    part: 'Part I — Foundations',
    written: true,
  },
  {
    slug: '04-xor-one-time-pad',
    order: 4,
    title: 'XOR & the One-Time Pad',
    blurb:
      'The only cipher with proven perfect secrecy — and the key-reuse mistake that breaks it. Build: an OTP, then crib-drag the two-time pad.',
    part: 'Part II — Secret-Key Cryptography',
    written: true,
  },
  {
    slug: '05-stream-ciphers',
    order: 5,
    title: 'Stream Ciphers: Expanding a Small Key',
    blurb:
      'The OTP needs a key as long as the message; keystream generators fake it. Build: a hash-based counter-mode stream cipher.',
    part: 'Part II — Secret-Key Cryptography',
    written: true,
  },
  {
    slug: '06-block-ciphers-modes',
    order: 6,
    title: 'Block Ciphers & Modes: ECB Is a Meme',
    blurb:
      'Fixed-size blocks, and why the mode of operation matters as much as the cipher. Build: the ECB penguin, rendered.',
    part: 'Part II — Secret-Key Cryptography',
    written: true,
  },
  {
    slug: '07-integrity-macs',
    order: 7,
    title: 'Integrity: MACs & the Length-Extension Trap',
    blurb:
      'Encryption hides messages; MACs prove they weren’t altered. Build: the broken hash(key‖msg), then real HMAC.',
    part: 'Part II — Secret-Key Cryptography',
    written: true,
  },
  {
    slug: '08-diffie-hellman',
    order: 8,
    title: 'Diffie–Hellman: Sharing Secrets Publicly',
    blurb:
      'The impossible-sounding trick: two strangers build a shared key on a public channel. Build: a DH exchange — then a man-in-the-middle attack.',
    part: 'Part III — Public-Key Cryptography',
    written: true,
  },
  {
    slug: '09-rsa-trapdoors',
    order: 9,
    title: 'RSA: Trapdoors from Factoring',
    blurb:
      'Multiply two primes: easy. Factor the product: hard. Build: textbook RSA from scratch — and why textbook RSA is dangerous.',
    part: 'Part III — Public-Key Cryptography',
    written: true,
  },
  {
    slug: '10-signatures-certificates',
    order: 10,
    title: 'Signatures & Certificates',
    blurb:
      'Authentication and non-repudiation, plus the trust-store chain that tames Chapter 8’s MITM. Build: sign, verify, chain.',
    part: 'Part III — Public-Key Cryptography',
    written: true,
  },
  {
    slug: '11-tls-putting-it-together',
    order: 11,
    title: 'TLS: The Whole Course in One Handshake',
    blurb:
      'Every protocol in this course, composed: DH + signatures + AEAD. Build: dissect a real TLS session with openssl s_client.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-secure-channel',
    order: 12,
    title: 'Final Boss: A Secure Channel in ~300 Lines',
    blurb:
      'DH handshake → key derivation → encrypted, authenticated messages — your own mini-TLS, MITM caveat included.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Cryptography on One Page',
    blurb:
      'Hashes, ciphers, MACs and key exchange on one page — the model, the primitives, the combinations that are safe, and the ones that are not.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the secure channel from Chapter 12 — hashes, ciphers, MACs, handshakes. Each is checkable by you alone.',
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
