// gossip.go — Chapter 9's epidemic dissemination in Go (Python original: chapters/09)
// run: go run gossip.go
package main

import (
	"fmt"
	"math/rand"
)

func simulate(n, dead, rounds int, loss float64, rng *rand.Rand) int {
	alive := map[int]bool{}
	for i := 0; i < n-dead; i++ {
		alive[i] = true
	}
	knows := map[int]bool{0: true} // node 0 starts the rumor
	for r := 1; r <= rounds; r++ {
		next := map[int]bool{}
		for k, v := range knows {
			next[k] = v
		}
		for node := range alive {
			if rng.Float64() < loss {
				continue // this exchange's messages vanished (Ch 1)
			}
			peer := rng.Intn(n)
			if !alive[peer] {
				continue
			}
			if knows[node] {
				next[peer] = true // push: I know, now you know
			}
			if knows[peer] {
				next[node] = true // pull: symmetric
			}
		}
		knows = next
		all := true
		for node := range alive {
			if !knows[node] {
				all = false
				break
			}
		}
		if all {
			return r // full infection in O(log n) rounds
		}
	}
	return -1
}

func main() {
	rng := rand.New(rand.NewSource(1))
	for _, n := range []int{10, 100, 1000, 10000} {
		theory := 0
		for 1<<theory < n {
			theory++
		}
		fmt.Printf("%6d nodes: full infection in %2d rounds (theory ≈ %2d = log2 n)\n",
			n, simulate(n, 0, 30, 0, rng), theory)
	}
	fmt.Printf("100 nodes, 30%% message loss: %2d rounds — robust by redundancy\n",
		simulate(100, 0, 40, 0.3, rng))
	fmt.Printf("100 nodes, 33 dead:          %2d rounds (only the living get told)\n",
		simulate(100, 33, 40, 0.3, rng))
}
