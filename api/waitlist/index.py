"""POST /api/waitlist — add an email to the waitlist (Supabase)."""

import json
import os
import traceback
import urllib.request
import urllib.error
from http.server import BaseHTTPRequestHandler


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            length = int(self.headers.get("Content-Length") or 0)
            raw = self.rfile.read(length) if length else b"{}"
            body = json.loads(raw)
            email = (body.get("email") or "").strip().lower()

            if not email or "@" not in email:
                self._json(400, {"ok": False, "message": "Adresse email invalide."})
                return

            supabase_url = os.environ["SUPABASE_URL"].strip()
            supabase_key = os.environ["SUPABASE_KEY"].strip()

            req = urllib.request.Request(
                f"{supabase_url}/rest/v1/waitlist",
                data=json.dumps({"email": email}).encode(),
                headers={
                    "apikey": supabase_key,
                    "Authorization": f"Bearer {supabase_key}",
                    "Content-Type": "application/json",
                    "Prefer": "return=minimal",
                },
                method="POST",
            )

            urllib.request.urlopen(req)
            self._json(201, {"ok": True, "message": "Inscription réussie."})

        except urllib.error.HTTPError as e:
            if e.code == 409:
                self._json(409, {"ok": False, "message": "Cet email est déjà inscrit."})
            else:
                self._json(500, {"ok": False, "message": f"Supabase error {e.code}"})
        except Exception:
            self._json(500, {"ok": False, "message": traceback.format_exc()})

    def _json(self, status, data):
        out = json.dumps(data).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(out)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
