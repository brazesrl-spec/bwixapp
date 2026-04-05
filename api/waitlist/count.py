"""GET /api/waitlist/count — return the number of waitlist signups (Supabase)."""

import json
import os
import urllib.request
from http.server import BaseHTTPRequestHandler

SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip()
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "").strip()


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        req = urllib.request.Request(
            f"{SUPABASE_URL}/rest/v1/waitlist?select=count",
            headers={
                "apikey": SUPABASE_KEY,
                "Authorization": f"Bearer {SUPABASE_KEY}",
                "Prefer": "count=exact",
            },
        )

        try:
            with urllib.request.urlopen(req) as res:
                data = json.loads(res.read())
                count = data[0]["count"] if data else 0
        except Exception:
            count = 0

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"count": count}).encode())
