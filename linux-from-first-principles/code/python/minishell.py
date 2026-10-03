# minishell.py — Chapter 4's mini shell in Python (the C original: chapters/04)
# run: python3 minishell.py
import os, sys

while True:
    try:
        line = input("mini$ ").strip()
    except EOFError:
        break
    if not line:
        continue
    args = line.split()

    if args[0] == "exit":                                    # builtin: kill OURSELVES
        break
    if args[0] == "cd":                                      # builtin: chdir OURSELVES
        os.chdir(args[1] if len(args) > 1 else os.path.expanduser("~"))
        continue

    outfile = None                                           # 3. find '>'
    if ">" in args:
        i = args.index(">")
        outfile, args = args[i + 1], args[:i]

    pid = os.fork()                                          # 4. fork
    if pid == 0:                                             # child:
        if outfile:
            fd = os.open(outfile, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o644)
            os.dup2(fd, 1)                                   # stdout IS the file
            os.close(fd)
        try:
            os.execvp(args[0], args)                         # 5. exec
        except OSError as e:
            print(f"mini: {args[0]}: {e}", file=sys.stderr)
            os._exit(127)
    _, status = os.waitpid(pid, 0)                           # 6. wait
    print(f"[exit {os.waitstatus_to_exitcode(status)}]")
