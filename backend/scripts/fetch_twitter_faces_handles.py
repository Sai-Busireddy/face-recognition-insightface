"""
fetch_twitter_faces_handles.py
Grab specific Twitter profiles (by @handle) and store their face vectors
in the `public_profiles` table.

Usage examples
--------------
# single handle
python scripts/fetch_twitter_faces_handles.py --handles TomCruise

# multiple handles (comma-separated)
python scripts/fetch_twitter_faces_handles.py --handles TomCruise,elonmusk,billgates

# handles from a text file (one per line, w/ or w/o @)
python scripts/fetch_twitter_faces_handles.py --file handles.txt
"""
import argparse, os, re, sys, time
from pathlib import Path
from typing import List

import cv2
import numpy as np
import requests
import tweepy

sys.path.append(".")
from utils.face_utils import get_face_embedding
from database.supabase_client import supabase

# ────────────────────────────────────────────────────────────────────
#  Helpers
# ────────────────────────────────────────────────────────────────────
def fullsize_avatar(url: str) -> str:
    return re.sub(r"_normal(\.\w+)$", r"\1", url)


def download_image(url: str) -> np.ndarray | None:
    try:
        r = requests.get(url, timeout=10)
        r.raise_for_status()
        return cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
    except requests.RequestException:
        print(f"[warn] cannot download {url}")
        return None


def upsert_profile(user: tweepy.User) -> bool:
    if not user.profile_image_url:
        return False
    img = download_image(fullsize_avatar(user.profile_image_url))
    if img is None:
        return False
    try:
        vec = get_face_embedding(img)
    except ValueError:
        print(f"[skip] no face in @{user.username}")
        return False

    supabase.table("public_profiles").upsert(
        {
            "platform":     "twitter",
            "profile_id":   str(user.id),
            "display_name": user.name,
            "image_url":    fullsize_avatar(user.profile_image_url),
            "face_vec":     vec.tolist(),
        },
        on_conflict="platform,profile_id",         # your working variant
    ).execute()
    print(f"[ok] stored @{user.username}")
    return True


# ────────────────────────────────────────────────────────────────────
#  Main
# ────────────────────────────────────────────────────────────────────
def load_handles_from_file(path: Path) -> List[str]:
    return [ln.lstrip("@").strip() for ln in path.read_text().splitlines() if ln.strip()]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--handles", help="Comma-separated list of @handles")
    ap.add_argument("--file", help="Text file with one handle per line")
    args = ap.parse_args()

    if not args.handles and not args.file:
        ap.error("Provide --handles or --file")

    handles: List[str] = []
    if args.handles:
        handles.extend(h.strip().lstrip("@") for h in args.handles.split(",") if h.strip())
    if args.file:
        handles.extend(load_handles_from_file(Path(args.file)))

    if not handles:
        print("No handles to fetch.")
        return

    bearer = os.getenv("TW_BEARER_TOKEN")
    if not bearer:
        raise RuntimeError("Set TW_BEARER_TOKEN in .env")

    client = tweepy.Client(bearer_token=bearer, wait_on_rate_limit=True)

    # Twitter API v2 allows batch look-up of up to 100 usernames
    chunk_size = 100
    stored = 0
    for i in range(0, len(handles), chunk_size):
        batch = handles[i : i + chunk_size]
        resp = client.get_users(
            usernames=batch,
            user_fields=["profile_image_url", "name", "username"],
        )
        if not resp.data:
            continue
        for user in resp.data:
            if upsert_profile(user):
                stored += 1
        time.sleep(0.5)  # friendly pause

    print(f"✔ finished: {stored} faces stored")

if __name__ == "__main__":
    main()
