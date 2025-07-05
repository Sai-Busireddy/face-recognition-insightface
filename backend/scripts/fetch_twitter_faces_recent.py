"""
Fetch up to 10 author profiles from the most recent tweets
matching a keyword (free Twitter Essential tier).

Run:
    python scripts/fetch_twitter_faces_recent.py --query "python developer"
"""

import argparse, os, sys, time, re
from typing import Set

import cv2
import numpy as np
import requests
import tweepy

# ------------------------------------------------------------------ #
#  Local project imports
# ------------------------------------------------------------------ #
sys.path.append(".")
from utils.face_utils import get_face_embedding
from database.supabase_client import supabase

# ------------------------------------------------------------------ #
#  Twitter v2 client (bearer-token only)
# ------------------------------------------------------------------ #
def get_client() -> tweepy.Client:
    bearer = os.getenv("TW_BEARER_TOKEN")
    if not bearer:
        raise RuntimeError("Set TW_BEARER_TOKEN in .env")
    return tweepy.Client(bearer_token=bearer, wait_on_rate_limit=True)

# ------------------------------------------------------------------ #
#  Helpers
# ------------------------------------------------------------------ #
def fullsize_avatar(url: str) -> str:
    """Turn ..._normal.jpg into …jpg for 400 × 400."""
    return re.sub(r"_normal(\.\w+)$", r"\1", url)

def download_image(url: str) -> np.ndarray | None:
    try:
        resp = requests.get(url, timeout=10)
        resp.raise_for_status()
        return cv2.imdecode(np.frombuffer(resp.content, np.uint8), cv2.IMREAD_COLOR)
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
        on_conflict="platform,profile_id",
    ).execute()
    print(f"[ok] stored @{user.username}")
    return True

# ------------------------------------------------------------------ #
#  Main
# ------------------------------------------------------------------ #
def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True, help="Keyword(s) for recent tweet search")
    args = ap.parse_args()

    client = get_client()

    # One recent-search request (<=10 tweets by default)
    resp = client.search_recent_tweets(
        query=args.query,
        max_results=10,
        expansions=["author_id"],
        user_fields=["profile_image_url", "name", "username"],
    )

    if not resp.data:
        print("No tweets found.")
        return

    users_by_id = {u.id: u for u in resp.includes["users"]}
    seen: Set[int] = set()
    stored = 0

    for tweet in resp.data:
        uid = tweet.author_id
        if uid in seen or uid not in users_by_id:
            continue
        seen.add(uid)
        if upsert_profile(users_by_id[uid]):
            stored += 1
        # stay friendly even though it’s only one request total
        time.sleep(0.5)

    print(f"✔ finished: {stored} faces stored ({len(seen)-stored} skipped)")

if __name__ == "__main__":
    main()
