---
layout: ../../layouts/Chapter.astro
title: 'systemd & the Birth of Services'
description: 'PID 1’s job: units, targets, dependencies, journalctl. We write our own service unit and watch it start.'
part: 'Part IV — The Running System'
written: true
---

Back in Chapter 1, the boot ended with PID 1 starting everything. Now that you know
processes (Ch 3), file descriptors (Ch 6), and users (Ch 8), you can finally understand
what PID 1 actually does all day — and do its job yourself, once, by hand. systemd is
controversial at dinner parties and completely unremarkable in practice: it's a process
supervisor with a config format.

## The lie you were told

> "A service is a daemon you start with a script."

A service is a **process whose parent is PID 1** — which means systemd owns its whole
lifecycle: starts it in order, keeps its environment, captures everything it prints, and
restarts it when it dies. The "script" model (SysV init) was exactly that: shell scripts
run at boot, praying they were in the right order. systemd replaced prayer with declared
**dependencies**.

## What PID 1 owes the system

Three eternal duties, from Chapter 3:

1. **Adopt orphans** — any process whose parent dies is re-parented to PID 1.
2. **Reap zombies** — collect every dead child's exit code, forever, never dying itself.
3. **Restart what should be running** — the machine's promise: "ssh will be there".

Everything else systemd does follows from supervising processes: units are just
declarations of *what* to run and *what must come first*.

## Units: services as config, not code

A `.service` file says: what command, what dependencies, what to do on failure.

```ini
[Unit]
Description=My web app
After=network-online.target      ; ordering: don't start before networking
Requires=network-online.target   ; and if it fails, don't bother

[Service]
ExecStart=/usr/bin/myapp --port 8080
Restart=always                   ; the promise from PID 1's job description
RestartSec=1

[Install]
WantedBy=multi-user.target       ; "run me in the normal boot" — a target = old runlevel
```

Drop it in `/etc/systemd/system/`, `systemctl daemon-reload`, `systemctl start myapp`.
That's the whole ceremony — nginx, postgres, docker: same three lines of intent, scaled up.

And the logs? Your service's stdout/stderr are **file descriptors** (Chapter 6), and PID 1
set them up: they point at **journald**, which indexes everything — so `journalctl -u myapp`
is your app's diary, boot-scoped, searchable.

## Prove it to yourself

**1. The supervised world, enumerated:**

```sh
systemctl list-units --type=service --state=running | head
```

**2. The boot, itemized** — Chapter 1's timeline with names attached:

```sh
systemd-analyze blame | head -5
systemd-analyze critical-chain
```

**3. Dependencies made visible:**

```sh
systemctl list-dependencies multi-user.target | head -15
```

## The build: your own service, killed and resurrected

No sudo needed — systemd runs a full manager for every user too:

**1.** The program, `~/heartbeat.sh`:

```sh
#!/bin/sh
while true; do
    echo "beat $(date +%T)"
    sleep 2
done
```

**2.** The unit, `~/.config/systemd/user/heartbeat.service`:

```ini
[Unit]
Description=First Principles heartbeat

[Service]
ExecStart=%h/heartbeat.sh
Restart=always
RestartSec=1

[Install]
WantedBy=default.target
```

**3.** Birth, verify, then **murder** it and watch PID 1 keep its promise:

```sh
chmod +x ~/heartbeat.sh
systemctl --user daemon-reload
systemctl --user enable --now heartbeat
systemctl --user status heartbeat          # active (running)

kill $(pgrep -f heartbeat.sh)              # kill the process itself...
sleep 2
systemctl --user status heartbeat          # ...it's BACK (Restart=always)

journalctl --user -u heartbeat -f          # its stdout, live, journaled
```

You just did the full service lifecycle: declared, started, killed, resurrected, and read
its logs. The difference between you and a distro maintainer is now a review process.

## What you now know

- A **service** = a process supervised by PID 1: ordered start, captured output, restart on death.
- **Units** declare intent (`After`, `Restart`, `WantedBy`); targets replaced runlevels.
- **journald** holds every service's stdout/stderr because PID 1 wired the fds (Ch 6 again).
- You've written one yourself — the same shape as every production unit file.

Next: the machine is *running*. Time to give it a network — and discover that everything
you learned about files and fds was secretly a networking course.
