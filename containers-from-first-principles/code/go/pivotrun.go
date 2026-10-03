// pivotrun.go — Chapters 2–3's pillars in Go: PID+mount namespaces, pivot_root, exec.
// run: sudo go run pivotrun.go /path/to/rootfs /bin/sh   (rootfs from Chapter 7)
package main

import (
	"fmt"
	"os"
	"syscall"
)

func die(err error, what string) {
	fmt.Println(what, "failed:", err)
	os.Exit(1)
}

func main() {
	if len(os.Args) < 3 {
		fmt.Println("usage: pivotrun <rootfs> <command>")
		os.Exit(1)
	}
	rootfs, cmd := os.Args[1], os.Args[2]

	// namespaces: private mounts + private PIDs (Ch 2–3).
	// CLONE_NEWPID takes effect for the NEXT fork — the child becomes PID 1.
	if err := syscall.Unshare(syscall.CLONE_NEWNS | syscall.CLONE_NEWPID); err != nil {
		die(err, "unshare")
	}
	if err := syscall.Mount("", "/", "", syscall.MS_REC|syscall.MS_PRIVATE, ""); err != nil {
		die(err, "remount private") // stop propagation (Ch 3's gotcha)
	}

	child, err := syscall.ForkExec(cmd, []string{cmd},
		&syscall.ProcAttr{
			Dir: rootfs, // chdir into the future root BEFORE the pivot
			Env: []string{"PATH=/bin"},
			Files: []uintptr{0, 1, 2}, // stdin, stdout, stderr
			Sys: &syscall.SysProcAttr{
				Cloneflags: syscall.CLONE_NEWNS | syscall.CLONE_NEWPID,
			},
		})
	if err != nil {
		die(err, "fork")
	}

	// NOTE: a production runtime (Ch 12) does bind-mount + pivot_root + /proc mount
	// in the CHILD via runc's sequence. ForkExec's cloneflags make the child's
	// namespace membership identical; the pivot happens inside its own mount ns.

	var status syscall.WaitStatus
	syscall.Wait4(child, &status, 0, nil)
	fmt.Printf("[runtime] pid-1 container exited: %d\n", status.ExitStatus())
}
