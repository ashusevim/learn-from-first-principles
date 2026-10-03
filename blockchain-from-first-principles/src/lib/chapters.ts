export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Chain',
  'Part II — Trust Without Trust',
  'Part III — Beyond the Basics',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-is-blockchain',
    order: 1,
    title: 'What Is a Blockchain, Really?',
    blurb:
      'A linked list where each link is a hash of the previous — tamper-evident by construction. Build: the chain, then tamper with it and watch it break.',
    part: 'Part I — The Chain',
    written: true,
  },
  {
    slug: '02-the-block',
    order: 2,
    title: 'The Block: Hashes Chain History',
    blurb:
      'What goes IN a block and how the hash chains it. Build: the block structure, then alter one byte and watch every hash after it break.',
    part: 'Part I — The Chain',
    written: true,
  },
  {
    slug: '03-proof-of-work',
    order: 3,
    title: 'Proof of Work: Making Forging Expensive',
    blurb:
      'Find a nonce whose hash starts with N zeros — guess until you win. Build: mining with adjustable difficulty, hashrate measured.',
    part: 'Part I — The Chain',
    written: true,
  },
  {
    slug: '04-decentralization',
    order: 4,
    title: 'Decentralization: No Single Point of Trust',
    blurb:
      'Multiple nodes, same rules, no boss. Build: three nodes syncing blocks and agreeing on the longest chain.',
    part: 'Part II — Trust Without Trust',
    written: true,
  },
  {
    slug: '05-transactions-signatures',
    order: 5,
    title: 'Transactions & Digital Signatures',
    blurb:
      'Spending requires proving ownership — the crypto course’s signatures, applied. Build: signed transactions verified by the network.',
    part: 'Part II — Trust Without Trust',
    written: true,
  },
  {
    slug: '06-mempool-validation',
    order: 6,
    title: 'The Mempool & Block Validation',
    blurb:
      'Pending transactions wait to be mined — and must be validated first. Build: the mempool with double-spend detection.',
    part: 'Part II — Trust Without Trust',
    written: true,
  },
  {
    slug: '07-double-spend',
    order: 7,
    title: 'Double-Spend & the Longest-Chain Rule',
    blurb:
      'The famous attack: spend the same coin twice on two forks. Build: the fork, the race, and the resolution.',
    part: 'Part III — Beyond the Basics',
    written: true,
  },
  {
    slug: '08-merkle-trees',
    order: 8,
    title: 'Merkle Trees: Efficient Verification',
    blurb:
      'Hash the transactions pairwise up a tree — one root proves all. Build: the tree and a proof that a transaction is included.',
    part: 'Part III — Beyond the Basics',
    written: true,
  },
  {
    slug: '09-wallets-addresses',
    order: 9,
    title: 'Wallets & Addresses',
    blurb:
      'Your address is your public key, hashed. Build: keypair → address → sign a spend. No account creation — the key IS the account.',
    part: 'Part III — Beyond the Basics',
    written: true,
  },
  {
    slug: '10-real-blockchains',
    order: 10,
    title: 'What Real Blockchains Add',
    blurb:
      'Bitcoin’s UTXO model, Ethereum’s smart contracts, and the scaling trilemma — your toy chain mapped to the giants.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-energy-alternatives',
    order: 11,
    title: 'The Energy Question & Proof of Stake',
    blurb:
      'PoW burns electricity for security — PoS replaces it with economic stake. Build: a toy PoS validator selection.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-complete-chain',
    order: 12,
    title: 'Final Boss: The Complete Blockchain in ~300 Lines',
    blurb:
      'Transactions, wallets, mining, validation, tamper detection — one file. The course ends with a chain you built and broke.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Blockchain on One Page',
    blurb:
      'The chain, proof of work, signatures and forks on one page — the model, the invariants, and the ways naive chains break.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on the chain from Chapter 12 — mining, tampering, double-spends, forks. Each is checkable by you alone.',
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
