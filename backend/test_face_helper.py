# test_face_helper.py
import cv2
from utils.face_utils import get_face_embedding

img = cv2.imread("sai.jpg")          # pick any clear selfie
vec = get_face_embedding(img)

print("Vector shape:", vec.shape)            # ➜ (512,)
print("First 5 numbers:", vec[:5])