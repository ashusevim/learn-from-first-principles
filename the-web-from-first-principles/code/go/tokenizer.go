// tokenizer.go — Chapter 5's forgiving HTML tokenizer in Go (Python original: ch 5)
// run: go run tokenizer.go '<p>hello <b>bold</p>world<img src="x.png">'
package main

import (
	"fmt"
	"os"
	"regexp"
	"strings"
)

var tagRe = regexp.MustCompile(`</?([a-zA-Z][a-zA-Z0-9]*)([^>]*)?>`)

func tokenize(html string) []string {
	var tokens []string
	pos := 0
	for _, m := range tagRe.FindAllStringSubmatchIndex(html, -1) {
		if text := strings.TrimSpace(html[pos:m[0]]); text != "" {
			tokens = append(tokens, "text: "+text) // text between tags
		}
		start, end := m[0], m[1]
		closing := strings.HasPrefix(html[start:end], "</")
		name := strings.ToLower(html[m[2]:m[3]])

		if closing {
			tokens = append(tokens, "end:   </"+name+">")
		} else {
			tokens = append(tokens, fmt.Sprintf("start: <%s%s>", name, html[m[4]:m[5]]))
			switch name { // void elements self-close (the spec's list, abridged)
			case "br", "img", "input", "hr", "meta", "link":
				tokens = append(tokens, "end:   </"+name+"> (implied: void)")
			}
		}
		pos = end
	}
	if text := strings.TrimSpace(html[pos:]); text != "" {
		tokens = append(tokens, "text: "+text)
	}
	return tokens
}

func main() {
	for _, t := range tokenize(os_args()) {
		fmt.Println(t)
	}
}

func os_args() string {
	args := osArgs()
	if len(args) > 1 {
		return args[1]
	}
	return `<p>hello <b>bold</p>world<img src="x.png"><p>next`
}

func osArgs() []string { return os.Args }
