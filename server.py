"""BWIX — Minimal Flask server for the waitlist."""

import json
import os
from pathlib import Path
from flask import Flask, request, jsonify, send_from_directory

app = Flask(__name__, static_folder=".", static_url_path="")

WAITLIST_FILE = Path(__file__).parent / "waitlist.json"


def _read_waitlist():
    if WAITLIST_FILE.exists():
        with open(WAITLIST_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []


def _write_waitlist(entries):
    with open(WAITLIST_FILE, "w", encoding="utf-8") as f:
        json.dump(entries, f, ensure_ascii=False, indent=2)


# ---------- Static files ----------

@app.route("/")
def index():
    return send_from_directory(".", "index.html")


# ---------- Waitlist API ----------

@app.route("/api/waitlist", methods=["POST"])
def waitlist_signup():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()

    if not email or "@" not in email:
        return jsonify(ok=False, message="Adresse email invalide."), 400

    entries = _read_waitlist()

    if any(e["email"] == email for e in entries):
        return jsonify(ok=False, message="Cet email est déjà inscrit."), 409

    entries.append({"email": email})
    _write_waitlist(entries)

    return jsonify(ok=True, message="Inscription réussie."), 201


@app.route("/api/waitlist/count")
def waitlist_count():
    entries = _read_waitlist()
    return jsonify(count=len(entries))


# ---------- Run ----------

if __name__ == "__main__":
    if not WAITLIST_FILE.exists():
        _write_waitlist([])
    app.run(host="0.0.0.0", port=8080, debug=True)
