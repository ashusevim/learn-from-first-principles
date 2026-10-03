export interface ChapterMeta {
  slug: string;
  order: number;
  title: string;
  blurb: string;
  part: string;
  written: boolean;
}

export const PARTS = [
  'Part I — The Machine Wakes Up',
  'Part II — Talking to the Machine',
  'Part III — The Kernel’s Resources',
  'Part IV — The Running System',
  'Part V — Power Tools',
  'Part VI — Practice & Reference',
] as const;

export const CHAPTERS: ChapterMeta[] = [
  {
    slug: '01-power-button',
    order: 1,
    title: 'What Happens When You Press the Power Button',
    blurb:
      'From dead silicon to a login prompt: firmware, bootloader, kernel, initramfs, PID 1. The whole boot, step by step.',
    part: 'Part I — The Machine Wakes Up',
    written: true,
  },
  {
    slug: '02-what-is-a-kernel',
    order: 2,
    title: 'What Is a Kernel, Really?',
    blurb:
      'Kernel vs. distro vs. shell vs. desktop. Syscalls as the only door between your code and the hardware, and how to watch them happen.',
    part: 'Part I — The Machine Wakes Up',
    written: true,
  },
  {
    slug: '03-processes',
    order: 3,
    title: 'Processes: fork, exec, and the Zombie Apocalypse',
    blurb:
      'A process is just a program that got a PID. fork(), exec(), wait(), signals, and why zombies exist.',
    part: 'Part I — The Machine Wakes Up',
    written: true,
  },
  {
    slug: '04-the-shell',
    order: 4,
    title: 'The Shell Is Just a REPL Over Syscalls',
    blurb:
      'Bash isn’t magic — it reads a line, expands it, and arranges syscalls. We build a mini shell in ~100 lines of C.',
    part: 'Part II — Talking to the Machine',
    written: true,
  },
  {
    slug: '05-everything-is-a-file',
    order: 5,
    title: 'Why Everything Is a File',
    blurb:
      'The VFS trick: inodes, dentries, and how /dev, /proc, and /sys expose the kernel as files you can cat.',
    part: 'Part II — Talking to the Machine',
    written: true,
  },
  {
    slug: '06-file-descriptors',
    order: 6,
    title: 'File Descriptors, Redirection & Pipes',
    blurb:
      'stdin/stdout/stderr are just fds 0, 1, 2. dup2 explains every redirection you’ve ever typed — and how | actually works.',
    part: 'Part II — Talking to the Machine',
    written: true,
  },
  {
    slug: '07-memory',
    order: 7,
    title: 'Memory Is a Lie (And That’s Good)',
    blurb:
      'Virtual memory, pages, mmap, the page cache, and the OOM killer. Why every process thinks it owns the machine.',
    part: 'Part III — The Kernel’s Resources',
    written: true,
  },
  {
    slug: '08-users-permissions',
    order: 8,
    title: 'Users, Permissions & sudo',
    blurb:
      'UIDs, permission bits, setuid, and capabilities. Root is just UID 0 — and the kernel checks numbers, not names.',
    part: 'Part III — The Kernel’s Resources',
    written: true,
  },
  {
    slug: '09-dynamic-linking',
    order: 9,
    title: 'Dynamic Linking: Every Binary Is Incomplete',
    blurb:
      'ld.so, ldd, LD_LIBRARY_PATH, static vs. dynamic. What actually happens between execve() and main().',
    part: 'Part III — The Kernel’s Resources',
    written: true,
  },
  {
    slug: '10-systemd',
    order: 10,
    title: 'systemd & the Birth of Services',
    blurb:
      'PID 1’s job: units, targets, dependencies, journalctl. We write our own service unit and watch it start.',
    part: 'Part IV — The Running System',
    written: true,
  },
  {
    slug: '11-networking',
    order: 11,
    title: 'Networking: Interfaces, Routes & Sockets',
    blurb:
      'ip, routing tables, ARP, and sockets as file descriptors. Where nftables sits and what a packet crosses to reach your process.',
    part: 'Part IV — The Running System',
    written: true,
  },
  {
    slug: '12-packages',
    order: 12,
    title: 'Packages & Distros: Who Puts Binaries on My Disk?',
    blurb:
      'Repositories, dependency resolution, and what pacman/apt actually do. The distro is a curation + update machine.',
    part: 'Part IV — The Running System',
    written: true,
  },
  {
    slug: '13-observability',
    order: 13,
    title: 'Observability: The Kernel Keeps Receipts',
    blurb:
      'strace, top, /proc, perf — every Linux debugging tool is a thin reader of kernel-provided data. We read the receipts ourselves.',
    part: 'Part V — Power Tools',
    written: true,
  },
  {
    slug: '14-containers',
    order: 14,
    title: 'Containers from Scratch',
    blurb:
      'Docker is namespaces + cgroups + overlayfs. The finale: we build a working container in ~70 lines of C, no Docker in sight.',
    part: 'Part V — Power Tools',
    written: true,
  },
  {
    slug: '15-cheat-sheet',
    order: 15,
    title: 'Cheat Sheet: Linux on One Page',
    blurb:
      'Boot, syscalls, processes, files and containers on one page — the model, the commands, and the traps with their chapters.',
    part: 'Part VI — Practice & Reference',
    written: true,
  },
  {
    slug: '16-labs',
    order: 16,
    title: 'Labs: Prove It Yourself',
    blurb:
      'Twelve labs from fork to containers — processes, file descriptors, namespaces, cgroups. Each is checkable by you alone.',
    part: 'Part VI — Practice & Reference',
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
