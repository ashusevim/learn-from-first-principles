export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — Wires and Frames',
  'Part II — TCP from Raw Bytes',
  'Part III — Programs on Top',
  'Part IV — The Real World',
  'Part V — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-what-the-wire-carries',
    order: 1,
    title: 'What the Wire Actually Carries',
    blurb:
      'Ethernet frames, MAC addresses, and what a NIC really does. Your packets are just structured bytes on copper.',
    part: 'Part I — Wires and Frames',
    written: true,
  },
  {
    slug: '02-ip-the-addressing-lie',
    order: 2,
    title: 'IP: The Addressing Lie',
    blurb:
      'Packets, fragmentation, TTL, and why IP is "unreliable by design". Build: craft raw IP packets by hand.',
    part: 'Part I — Wires and Frames',
    written: true,
  },
  {
    slug: '03-arp-asking-the-room',
    order: 3,
    title: 'ARP: Asking the Whole Room',
    blurb:
      'Who has 192.168.1.1? Broadcasts, caches, and spoofing. Build: your own ARP scanner.',
    part: 'Part I — Wires and Frames',
    written: true,
  },
  {
    slug: '04-tcp-handshake-byte-by-byte',
    order: 4,
    title: 'The TCP Handshake, Byte by Byte',
    blurb:
      'SYN, SYN-ACK, ACK — sequence numbers, flags, and the checksum. The killer chapter: perform a full handshake with raw sockets.',
    part: 'Part II — TCP from Raw Bytes',
    written: true,
  },
  {
    slug: '05-data-acks-retransmission',
    order: 5,
    title: 'Data, ACKs & Retransmission',
    blurb:
      'Sliding windows, retransmit timers, congestion control in miniature. Build: transfer a file over your own TCP.',
    part: 'Part II — TCP from Raw Bytes',
    written: true,
  },
  {
    slug: '06-teardown-and-states',
    order: 6,
    title: 'Teardown & the Strange States',
    blurb:
      'FIN, RST, TIME_WAIT — why connections linger and what netstat is really telling you.',
    part: 'Part II — TCP from Raw Bytes',
    written: true,
  },
  {
    slug: '07-sockets-and-the-kernel',
    order: 7,
    title: 'Sockets: The Kernel’s Side of the Deal',
    blurb:
      'What socket/bind/listen/accept actually build inside the kernel, and how fd tables meet TCP state.',
    part: 'Part III — Programs on Top',
    written: true,
  },
  {
    slug: '08-dns-the-phone-book',
    order: 8,
    title: 'DNS: The Internet’s Phone Book',
    blurb:
      'Queries, root servers, recursion, caching. Build: a tiny resolver that talks to the root servers itself.',
    part: 'Part III — Programs on Top',
    written: true,
  },
  {
    slug: '09-http-from-raw-bytes',
    order: 9,
    title: 'HTTP Is Just Text (Until It Isn’t)',
    blurb:
      'Requests and responses on the wire, headers as lines, keep-alive. Build: an HTTP server on raw sockets, zero libraries.',
    part: 'Part III — Programs on Top',
    written: true,
  },
  {
    slug: '10-tls-the-hiding-handshake',
    order: 10,
    title: 'TLS: The Handshake That Hides Everyone',
    blurb:
      'Certificates, key exchange, trust stores. Build: dissect a real TLS handshake with openssl s_client.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '11-nat-routers-traceroute',
    order: 11,
    title: 'NAT, Routers & the Edge of Your Street',
    blurb:
      'How packets leave home, what your router rewrites, and what traceroute’s stars actually mean.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '12-final-boss-ping',
    order: 12,
    title: 'Final Boss: ping, from Scratch',
    blurb:
      'ICMP echo, raw sockets, and checksums you compute yourself. The course ends with you owning ping.',
    part: 'Part IV — The Real World',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Networking on One Page',
    blurb:
      'Frames, IP, TCP, DNS and TLS on one page — the model, the byte layouts, the state machine, and the tools that read them.',
    part: 'Part V — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs from raw frames to ping from Chapter 12 — handshakes, retransmits, sockets. Each is checkable by you alone.',
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
