"""
utils/face_utils.py
Modern face-detection + embedding helper built on InsightFace.

• Detects the largest face in an image (BGR numpy array).
• Returns a 512-D float32 embedding ready for cosine search.
• Raises ValueError if no face is found.
"""

from functools import lru_cache

import cv2
import numpy as np
from insightface.app import FaceAnalysis

# ---------------------------------------------------------------------- #
#  Model loader – cached so the heavy weights are loaded only once
# ---------------------------------------------------------------------- #
@lru_cache(maxsize=1)
def _get_face_app() -> FaceAnalysis:
    """Load RetinaFace detector + ArcFace-R100 embedder (buffalo_l)."""
    app = FaceAnalysis(name="buffalo_l")   # RetinaFace + ArcFace
    # ctx_id = 0  ➜ use first CUDA GPU if present, else CPU
    app.prepare(ctx_id=0, det_size=(640, 640))
    return app


# ---------------------------------------------------------------------- #
#  Public API
# ---------------------------------------------------------------------- #
def get_face_embedding(img_bgr: np.ndarray) -> np.ndarray:
    """
    Detect, align and embed the *largest* face in `img_bgr`.

    Parameters
    ----------
    img_bgr : np.ndarray
        Image in OpenCV BGR format.

    Returns
    -------
    np.ndarray
        Normalised 512-dimensional float32 vector.

    Raises
    ------
    ValueError
        If no face is detected.
    """
    app = _get_face_app()
    faces = app.get(img_bgr)

    if not faces:
        raise ValueError("No face detected in the image")

    # Take the biggest face by bounding-box area
    faces.sort(key=lambda f: (f.bbox[2] - f.bbox[0]) *
                             (f.bbox[3] - f.bbox[1]),
               reverse=True)
    return faces[0].normed_embedding.astype(np.float32)