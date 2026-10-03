export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Kernel Foundation',
  'Part II — The Runtime',
  'Part III — The Ecosystem',
  'Part IV — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-process-is-a-container',
    order: 1,
    title: 'A Process Is a Container That Isn’t',
    blurb:
      'No virtualization, no VM: a container is an ordinary process shown a smaller world. Build: unshare a shell and watch lsns prove it.',
    part: 'Part I — The Kernel Foundation',
    written: true,
  },
  {
    slug: '02-pid-namespaces',
    order: 2,
    title: 'PID Namespaces: A Private Process Tree',
    blurb:
      'Inside the container, PID 1 is your shell. Build: unshare --pid --fork --mount-proc, then meet PID 1’s reaping duties up close.',
    part: 'Part I — The Kernel Foundation',
    written: true,
  },
  {
    slug: '03-mount-namespaces-pivot-root',
    order: 3,
    title: 'Mount Namespaces & pivot_root: A Private Filesystem',
    blurb:
      'The container’s "/" is just a directory on your disk — until pivot_root makes it the only world. Build: a private mount namespace by hand.',
    part: 'Part I — The Kernel Foundation',
    written: true,
  },
  {
    slug: '04-network-namespaces',
    order: 4,
    title: 'Network Namespaces: A Private Internet',
    blurb:
      'A container with no network is safe and useless — veth pairs wire two private internets together. Build: your own docker0 bridge.',
    part: 'Part I — The Kernel Foundation',
    written: true,
  },
  {
    slug: '05-cgroups-budget',
    order: 5,
    title: 'cgroups: The Budget',
    blurb:
      'Namespaces hide the world; cgroups ration it. Build: memory.max + a process that OOMs on camera, CPU quotas measured.',
    part: 'Part II — The Runtime',
    written: true,
  },
  {
    slug: '06-images-overlayfs',
    order: 6,
    title: 'Images & overlayfs: Layers That Stack',
    blurb:
      'Why images are small and pulls are incremental: read-only layers + one writable layer. Build: an overlayfs mount, inspected live.',
    part: 'Part II — The Runtime',
    written: true,
  },
  {
    slug: '07-rootfs-distroless',
    order: 7,
    title: 'The rootfs: What’s Actually in There',
    blurb:
      'An image is a tarball of a filesystem — nothing more. Build: a minimal rootfs with busybox, booted by your own namespace code.',
    part: 'Part II — The Runtime',
    written: true,
  },
  {
    slug: '08-runc-oci-spec',
    order: 8,
    title: 'runc: Reading the Real Spec',
    blurb:
      'The OCI runtime spec is a JSON file describing namespaces, cgroups, and mounts. Build: run runc on your Chapter 7 rootfs.',
    part: 'Part II — The Runtime',
    written: true,
  },
  {
    slug: '09-docker-anatomy',
    order: 9,
    title: 'Docker’s Anatomy: shim, containerd, daemon',
    blurb:
      'docker run is six processes in a trench coat. Build: trace them with ps/lsns while a container lives, and name each one’s job.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '10-container-networking',
    order: 10,
    title: 'Container Networking: veth, docker0, NAT',
    blurb:
      'How a container packet reaches the internet — and why -p 8080:80 is an nftables rule. Build: trace a packet hop by hop.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '11-volumes-ports-contract',
    order: 11,
    title: 'Volumes, Ports & the Filesystem Contract',
    blurb:
      'Writable layers die with the container; volumes outlive them. Build: prove it — write to both, kill the container, check.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '12-final-boss-runtime',
    order: 12,
    title: 'Final Boss: Your Own Container Runtime',
    blurb:
      'Namespaces + cgroups + overlayfs + a rootfs, in ~200 lines. run sh inside your own runtime. The course ends where Docker began.',
    part: 'Part III — The Ecosystem',
    written: true,
  },
  {
    slug: '13-cheat-sheet',
    order: 13,
    title: 'Cheat Sheet: Containers on One Page',
    blurb:
      'Namespaces, cgroups, overlayfs and OCI on one page — the four kernel features, the syscalls, and the traps in the runtime.',
    part: 'Part IV — Practice & Reference',
    written: true,
  },
  {
    slug: '14-labs',
    order: 14,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs on your own runtime from Chapter 12 — namespaces, cgroups, overlayfs, networking. Each is checkable by you alone.',
    part: 'Part IV — Practice & Reference',
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
