// btree.go — Chapter 3's B-tree in Go (the Python original: chapters/03)
// run: go run btree.go
package main

import "fmt"

const ORDER = 4 // max keys per node before splitting

type node struct {
	keys []int
	kids []*node
	leaf bool
}

type BTree struct{ root *node }

func newTree() *BTree { return &BTree{root: &node{leaf: true}} }

func (t *BTree) insert(key int) {
	if len(t.root.keys) == ORDER-1 { // root full: depth grows here only
		sibling := &node{leaf: false, kids: []*node{t.root}}
		t.split(sibling, 0)
		t.root = sibling
	}
	t.insertNonFull(t.root, key)
}

func (t *BTree) split(parent *node, i int) {
	child := parent.kids[i]
	mid := len(child.keys) / 2
	right := &node{leaf: child.leaf, keys: append([]int(nil), child.keys[mid+1:]...)}
	if !child.leaf {
		right.kids = append([]*node(nil), child.kids[mid+1:]...)
		child.kids = child.kids[:mid+1]
	}
	parent.keys = append(parent.keys, 0)
	copy(parent.keys[i+1:], parent.keys[i:])
	parent.keys[i] = child.keys[mid]
	child.keys = child.keys[:mid]
	parent.kids = append(parent.kids, nil)
	copy(parent.kids[i+2:], parent.kids[i+1:])
	parent.kids[i+1] = right
}

func (t *BTree) insertNonFull(n *node, key int) {
	if n.leaf {
		n.keys = append(n.keys, key)
		for i := len(n.keys) - 1; i > 0 && n.keys[i-1] > n.keys[i]; i++ {
			n.keys[i-1], n.keys[i] = n.keys[i], n.keys[i-1]
		}
		return
	}
	i := len(n.keys)
	for j, k := range n.keys {
		if key < k {
			i = j
			break
		}
	}
	if len(n.kids[i].keys) == ORDER-1 {
		t.split(n, i)
		if key > n.keys[i] {
			i++
		}
	}
	t.insertNonFull(n.kids[i], key)
}

func (t *BTree) search(key int) (bool, int) {
	n, reads := t.root, 0 // each level = one "page read" (Ch 3's whole point)
	for {
		reads++
		i := len(n.keys)
		for j, k := range n.keys {
			if key <= k {
				i = j
				break
			}
		}
		if i < len(n.keys) && n.keys[i] == key {
			return true, reads
		}
		if n.leaf {
			return false, reads
		}
		n = n.kids[i]
	}
}

func main() {
	t := newTree()
	for k := 0; k < 100000; k += 7 {
		t.insert(k) // keys: 0, 7, 14, ... ≡ 0 (mod 7)
	}
	fmt.Println(t.search(60004)) // true  4  — a real key, found in 4 page reads
	fmt.Println(t.search(60006)) // false 4  — not ≡ 0 (mod 7): correctly absent
}
