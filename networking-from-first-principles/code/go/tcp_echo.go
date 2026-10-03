// tcp_echo.go — Chapter 11's TCP echo server in Go (the C original: chapters/11)
// run: go run tcp_echo.go    then:  nc 127.0.0.1 8080
package main

import (
	"io"
	"log"
	"net"
)

func main() {
	ln, err := net.Listen("tcp", ":8080") // socket + bind + listen, one call
	if err != nil {
		log.Fatal(err)
	}
	log.Println("listening on :8080")
	for {
		conn, err := ln.Accept() // NEW fd (Conn) per client — Ch 6's accept
		if err != nil {
			continue
		}
		go func(c net.Conn) { // a goroutine per client: green threads (Ch 8!)
			defer c.Close()
			io.Copy(c, c) // read bytes, give them back — echo
		}(conn)
	}
}
