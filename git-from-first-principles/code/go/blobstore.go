// blobstore.go — Chapter 1's content-addressed blob store in Go (Python original: ch 1)
// run inside any git repo:  go run blobstore.go "hello store"
package main

import (
	"bytes"
	"compress/zlib"
	"crypto/sha1"
	"fmt"
	"os"
	"path"
)

func store(data []byte) (string, error) {
	var raw bytes.Buffer
	fmt.Fprintf(&raw, "blob %d\x00", len(data)) // the header git prepends
	raw.Write(data)

	key := fmt.Sprintf("%x", sha1.Sum(raw.Bytes())) // content -> key
	dir := path.Join(".git", "objects", key[:2])
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return "", err
	}
	p := path.Join(dir, key[2:])
	if _, err := os.Stat(p); os.IsNotExist(err) {
		var z bytes.Buffer
		w := zlib.NewWriter(&z)
		w.Write(raw.Bytes()) // value = zlib(header + content)
		w.Close()
		if err := os.WriteFile(p, z.Bytes(), 0o644); err != nil {
			return "", err
		}
	}
	return key, nil
}

func main() {
	data := []byte("hello store")
	if len(os.Args) > 1 {
		data = []byte(os.Args[1])
	}
	key, err := store(data)
	if err != nil {
		panic(err)
	}
	// verify with git:  git cat-file -p <key>  — git reads YOUR object perfectly.
	fmt.Println("key:", key)
}
