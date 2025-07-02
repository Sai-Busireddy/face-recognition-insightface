# routes/face_router.py
from fastapi import APIRouter, UploadFile, HTTPException
import cv2, numpy as np

from utils.face_utils import get_face_embedding
from database.supabase_client import supabase  # your existing helper

router = APIRouter(prefix="/api/face", tags=["face"])


# ------------------------------------------------------------------ #
#  POST /api/face/register   (store embedding for an existing user)
# ------------------------------------------------------------------ #
@router.post("/register")
async def register_face(user_id: str, file: UploadFile):
    """
    • user_id – UUID of existing row in `users`
    • file    – image containing the person’s face
    """
    img_bytes = await file.read()
    img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image")

    try:
        emb = get_face_embedding(img)  # (512,) float32
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    resp = (
        supabase.table("users")
        .update({"face_vec": emb.tolist()})
        .eq("id", user_id)
        .execute()
    )
    if resp.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"DB error → {resp.data}")

    return {"ok": True, "user_id": user_id}


# ------------------------------------------------------------------ #
#  POST /api/face/search      (find best matches)
# ------------------------------------------------------------------ #
@router.post("/search")
async def search_face(file: UploadFile, top_k: int = 5):
    """
    • file   – query image
    • top_k  – number of matches to return (default 5)
    """
    img_bytes = await file.read()
    img = cv2.imdecode(np.frombuffer(img_bytes, np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Cannot decode image")

    try:
        emb = get_face_embedding(img)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # call the match_faces() SQL function we created above
    rpc = supabase.rpc(
        "match_faces",
        {"query_vec": emb.tolist(), "k": top_k},
    ).execute()

    if rpc.status_code >= 400:
        raise HTTPException(status_code=500, detail=f"DB error → {rpc.data}")

    return {"matches": rpc.data}