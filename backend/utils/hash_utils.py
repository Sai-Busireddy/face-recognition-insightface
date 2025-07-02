import cv2
import numpy as np
import base64

def image_hash(base64_str: str) -> str:
    """
    Your existing hash function - keeping exactly the same logic
    """
    encoded_data = base64_str.split(",")[1]
    img_data = base64.b64decode(encoded_data)
    np_arr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)
    
    resized = cv2.resize(img, (8, 8), interpolation=cv2.INTER_AREA)
    
    pixels = resized.flatten()
    avg = pixels.mean()

    # Generate hash
    hash_bits = ''.join(['1' if pixel > avg else '0' for pixel in pixels])
    return hash_bits.zfill(64)
