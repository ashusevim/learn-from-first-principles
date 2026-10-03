# tcp_echo.py — the socket/bind/listen/accept ceremony, explicitly (chapters/11)
# run: python3 tcp_echo.py    then:  nc 127.0.0.1 8080
import socket

srv = socket.socket(socket.AF_INET, socket.SOCK_STREAM)   # [1] an fd
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", 8080))                             # claim :8080
srv.listen(8)                                             # the classified ad
print("listening on :8080")

while True:
    conn, addr = srv.accept()                             # NEW socket per client
    with conn:
        print("client from", addr)
        while True:
            data = conn.recv(256)                         # read bytes
            if not data:
                break
            conn.sendall(data)                            # give them back
