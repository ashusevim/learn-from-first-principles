// spinlock.go — Chapter 2's spinlock from an atomic test-and-set (C original: ch 2)
// run: go run spinlock.go
package main

import (
	"fmt"
	"sync"
	"sync/atomic"
)

type Spinlock struct{ flag atomic.Bool }

func (s *Spinlock) Lock() {
	for !s.flag.CompareAndSwap(false, true) { // test-and-set until WE set it
		// spin — burn CPU, but burn it CORRECTLY (Ch 2)
	}
}
func (s *Spinlock) Unlock() { s.flag.Store(false) }

func main() {
	var lock Spinlock
	var counter int64 // the crime scene from Chapter 1

	var wg sync.WaitGroup
	for g := 0; g < 2; g++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for i := 0; i < 1000000; i++ {
				lock.Lock()
				counter++ // guarded: LOAD/ADD/STORE now indivisible
				lock.Unlock()
			}
		}()
	}
	wg.Wait()
	fmt.Println("expected 2000000, got", counter) // 2000000. Every run.
}
