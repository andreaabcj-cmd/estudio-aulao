"""Servidor local do Estudio Aulao.

Igual ao servidor simples do Python, com uma diferenca: pede ao navegador para
conferir a versao de cada arquivo. Assim um F5 comum sempre mostra o que ha de novo.
So atende este computador (127.0.0.1).
"""
import functools
import http.server
import pathlib
import sys

RAIZ = pathlib.Path(__file__).resolve().parent.parent
PORTA = int(sys.argv[1]) if len(sys.argv) > 1 else 8790


class Pagina(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webp": "image/webp"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-cache")
        super().end_headers()

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    atende = functools.partial(Pagina, directory=str(RAIZ))
    http.server.ThreadingHTTPServer(("127.0.0.1", PORTA), atende).serve_forever()
