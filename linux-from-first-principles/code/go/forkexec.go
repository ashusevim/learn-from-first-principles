// forkexec.go — Chapter 3's fork/exec/wait pattern in Go (the C original: chapters/03)
// run: go run forkexec.go
package main

import (
	"fmt"
	"os"
	"os/exec"
)

func main() {
	cmd := exec.Command("ls", "-l") // Go's exec wraps fork+exec for you...
	cmd.Stdout = os.Stdout
	if err := cmd.Run(); err != nil { // ...but under the hood it is the same
		fmt.Println("exec failed:", err) // three syscalls: fork, execve, wait
		os.Exit(127)
	}
	fmt.Println("child exited:", cmd.ProcessState.ExitCode())

	// want the raw pattern? fork a copy of THIS process, then exec in the child:
	if len(os.Args) > 1 && os.Args[1] == "--raw" {
		p, _ := os.StartProcess("/bin/ls", []string{"ls", "/"},
			&os.ProcAttr{Files: []*os.File{os.Stdin, os.Stdout, os.Stderr}})
		p.Wait()
	}
}
