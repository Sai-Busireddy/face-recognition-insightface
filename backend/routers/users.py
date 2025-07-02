from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from database.supabase_client import supabase
from utils.face_utils import get_face_embedding          # ← NEW
from utils.hash_utils import image_hash
from pydantic import BaseModel
import cv2
import numpy as np
import base64
import pickle
import json
import jwt
from typing import Optional
import os
from datetime import datetime

router = APIRouter(tags=["users"])

JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")  
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

class SearchRequest(BaseModel):
    image: str
    type: str

class User(BaseModel):
    id: str
    email: str
    name: str

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    Verify JWT token and return user information
    """
    try:
        token = credentials.credentials
        
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            raise HTTPException(
                status_code=401,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        user_id = payload.get("id")
        email = payload.get("email")
        name = payload.get("name")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=401,
                detail="Invalid token payload",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        return User(id=user_id, email=email, name=name)
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"}
        )
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"}
        )

def extract_features(base64_str: str):
    """
    Extract ORB features from base64 image string for storage
    Returns:
        Tuple[str, int] -> base64 feature string, number of keypoints
    """
    if not base64_str:
        return None, 0
        
    print("🔍 Extracting features for storage...")

    try:
        encoded_data = base64_str.split(",")[1]
        img_data = base64.b64decode(encoded_data)
        np_arr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_GRAYSCALE)

        print(f"📸 Image decoded - Shape: {img.shape}")

        # Reduce nfeatures from 500 to 200 to make data smaller
        orb = cv2.ORB_create(nfeatures=500)
        keypoints, descriptors = orb.detectAndCompute(img, None)

        if descriptors is not None:
            print(f"✅ Extracted {len(keypoints)} keypoints for storage")
            
            # SOLUTION 1: Store as JSON instead of pickle to avoid truncation
            # Convert numpy array to list for JSON serialization
            descriptors_list = descriptors.tolist()
            descriptors_dict = {
                'shape': descriptors.shape,
                'dtype': str(descriptors.dtype),
                'data': descriptors_list
            }
            
            # Serialize as JSON string
            json_features = json.dumps(descriptors_dict)
            print(f"📏 JSON serialized size: {len(json_features)} characters")
            
            # Encode as base64 for storage
            base64_features = base64.b64encode(json_features.encode('utf-8')).decode('utf-8')
            print(f"📏 Base64 encoded size: {len(base64_features)} characters")
            
            return base64_features, len(keypoints)
        else:
            print("❌ No features found in image")
            return None, 0

    except Exception as e:
        print(f"❌ Feature extraction error: {e}")
        return None, 0

def b64_to_bgr(img_b64: str):
    """Convert a data-URL/base64 image string to an OpenCV BGR ndarray."""
    try:
        encoded = img_b64.split(",")[1]
        arr = np.frombuffer(base64.b64decode(encoded), np.uint8)
        return cv2.imdecode(arr, cv2.IMREAD_COLOR)
    except Exception:
        return None

def safe_decode_features(features_str):
    """Decode features that might be hex-encoded or base64-encoded from Supabase bytea"""
    try:
        if not features_str or not isinstance(features_str, str):
            raise ValueError("Invalid features string")
        
        features_str = features_str.strip()
        
        # Handle Supabase bytea hex format (starts with \x)
        if features_str.startswith('\\x'):
            print(f"🔧 Detected Supabase hex-encoded data of length: {len(features_str)}")
            
            # Remove the initial \x and decode as hex
            hex_string = features_str[2:]  # Remove the \x prefix
            decoded_bytes = bytes.fromhex(hex_string)
            print(f"🔧 Successfully decoded hex to {len(decoded_bytes)} bytes")
            
            # Try to decode as UTF-8 first (for JSON data)
            try:
                json_str = decoded_bytes.decode('utf-8')
                print(f"🔧 Successfully decoded as UTF-8 JSON string")
                return json_str, 'json'
            except UnicodeDecodeError:
                print(f"🔧 Not UTF-8, treating as pickle data")
                return decoded_bytes, 'pickle'
            
        # Handle regular hex format (no \x prefix, but all hex characters)
        elif all(c in '0123456789abcdefABCDEF' for c in features_str):
            print(f"🔧 Detected plain hex-encoded data of length: {len(features_str)}")
            decoded_bytes = bytes.fromhex(features_str)
            print(f"🔧 Successfully decoded hex to {len(decoded_bytes)} bytes")
            
            # Try to decode as UTF-8 first (for JSON data)
            try:
                json_str = decoded_bytes.decode('utf-8')
                print(f"🔧 Successfully decoded as UTF-8 JSON string")
                return json_str, 'json'
            except UnicodeDecodeError:
                print(f"🔧 Not UTF-8, treating as pickle data")
                return decoded_bytes, 'pickle'
            
        else:
            # Try base64 decoding
            print(f"🔧 Attempting base64 decode of length: {len(features_str)}")
            
            # Try direct decoding first
            try:
                decoded = base64.b64decode(features_str, validate=True)
                
                # Try to decode as UTF-8 first (for JSON data)
                try:
                    json_str = decoded.decode('utf-8')
                    print(f"🔧 Successfully decoded as UTF-8 JSON string")
                    return json_str, 'json'
                except UnicodeDecodeError:
                    print(f"🔧 Not UTF-8, treating as pickle data")
                    return decoded, 'pickle'
                    
            except Exception:
                # Try with padding fix
                missing_padding = len(features_str) % 4
                if missing_padding:
                    padded_str = features_str + '=' * (4 - missing_padding)
                    decoded = base64.b64decode(padded_str, validate=True)
                    
                    # Try to decode as UTF-8 first (for JSON data)
                    try:
                        json_str = decoded.decode('utf-8')
                        print(f"🔧 Successfully decoded as UTF-8 JSON string")
                        return json_str, 'json'
                    except UnicodeDecodeError:
                        print(f"🔧 Not UTF-8, treating as pickle data")
                        return decoded, 'pickle'
                raise
                
    except Exception as e:
        print(f"🔧 Feature decode error: {e}")
        print(f"🔧 First 100 chars of features_str: {features_str[:100]}")
        raise
    
def match_features(search_descriptors, stored_features_str, min_matches=20):
    """
    Match features between search image and stored image using ORB descriptors
    """
    try:
        print("Start of match features -------------")
        print(f"🔍 Type of stored_features before decoding: {type(stored_features_str)}, {type(search_descriptors)}")
        
        # Decode the stored features
        decoded_data, data_type = safe_decode_features(stored_features_str)
        
        if data_type == 'json':
            print(f"🔧 Processing JSON format features")
            # Parse JSON data
            try:
                descriptors_dict = json.loads(decoded_data)
                stored_descriptors = np.array(descriptors_dict['data'], dtype=descriptors_dict['dtype'])
                print(f"🔧 Successfully loaded JSON descriptors with shape: {stored_descriptors.shape}")
            except Exception as json_error:
                print(f"❌ JSON deserialization failed: {json_error}")
                raise Exception(f"Cannot deserialize JSON features: {json_error}")
                
        else:  # pickle format
            print(f"🔧 Processing pickle format features")
            try:
                stored_descriptors = pickle.loads(decoded_data)
                print(f"🔧 Successfully unpickled descriptors with shape: {stored_descriptors.shape}")
            except Exception as pickle_error:
                print(f"❌ Pickle deserialization failed: {pickle_error}")
                print(f"🔧 Decoded bytes (first 50): {decoded_data[:50]}")
                print(f"🔧 Decoded bytes (last 50): {decoded_data[-50:]}")
                raise Exception(f"Cannot deserialize stored features: {pickle_error}")
        
        print(f"🔧 Descriptor type: {type(stored_descriptors)}")
        print(f"🔧 Descriptor dtype: {stored_descriptors.dtype}")
        
        print(f"🔄 Matching features - Search: {search_descriptors.shape[0]} vs Stored: {stored_descriptors.shape[0]}")
        
        # Ensure both descriptors have the same data type
        if search_descriptors.dtype != stored_descriptors.dtype:
            print(f"🔧 Converting descriptor types: {search_descriptors.dtype} -> {stored_descriptors.dtype}")
            search_descriptors = search_descriptors.astype(stored_descriptors.dtype)
        
        # Create BFMatcher
        bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        matches = bf.match(search_descriptors, stored_descriptors)
        matches = sorted(matches, key=lambda x: x.distance)
        
        print(f"🎯 Found {len(matches)} raw matches")
        
        # Filter good matches
        good_matches = [m for m in matches if m.distance < 50]
        print(f"✨ Good matches after filtering: {len(good_matches)}")
        
        # Calculate metrics
        if len(good_matches) > 0:
            avg_distance = sum([m.distance for m in good_matches]) / len(good_matches)
            match_ratio = len(good_matches) / min(len(search_descriptors), len(stored_descriptors))
            
            return {
                "good_matches": len(good_matches),
                "total_matches": len(matches),
                "avg_distance": avg_distance,
                "match_ratio": match_ratio,
                "is_match": len(good_matches) >= min_matches
            }
        else:
            return {
                "good_matches": 0,
                "total_matches": 0,
                "avg_distance": float('inf'),
                "match_ratio": 0.0,
                "is_match": False
            }
            
    except Exception as e:
        print(f"❌ Feature matching error: {e}")
        print(f"🔍 Debug info - Stored features type: {type(stored_features_str)}")
        print(f"🔍 Debug info - Stored features length: {len(stored_features_str) if stored_features_str else 'None'}")
        print(f"🔍 Debug info - Search descriptors shape: {search_descriptors.shape if search_descriptors is not None else 'None'}")
        return {
            "good_matches": 0,
            "total_matches": 0,
            "avg_distance": float('inf'),
            "match_ratio": 0.0,
            "is_match": False
        }

@router.post("/search")
async def search_user(req: SearchRequest, current_user: User = Depends(verify_jwt_token)):
    """
    Search for users using biometric data with JWT authentication
    """
    try:
        print(f"\n🚀 Starting search for {req.type} image...")
        print(f"👤 Authenticated user: {current_user.name} ({current_user.email})")

        # ------------------------------------------------------------------
        # NEW: fast vector search when the query type is "face"
        # ------------------------------------------------------------------
        if req.type == "face":
            print("\n🚀 Vector-based face search enabled …")
            img_bgr = b64_to_bgr(req.image)
            if img_bgr is None:
                return {"match": False, "reason": "invalid_image"}

            try:
                emb = get_face_embedding(img_bgr)          # 512-D numpy
            except ValueError as e:
                return {"match": False, "reason": str(e)}

            # 1️⃣ get top-1 id + similarity score from match_faces()
            rpc = supabase.rpc(
                "match_faces",
                {"query_vec": emb.tolist(), "k": 1}
            ).execute()

            # Supabase-py v2 returns SingleAPIResponse: use .error / .data
            if getattr(rpc, "error", None):
                raise HTTPException(status_code=500, detail=f"DB error → {rpc.error}")

            
            hits = rpc.data or []

            if not hits:
                return {
                    "match": False,
                    "reason": "no_match_vector",
                    "search_info": {
                        "engine": "vector",
                        "searched_by": current_user.email
                    }
                }

            best_hit = hits[0]         # {'id': uuid, 'first_name': …, 'score': …}

            # 2️⃣ pull the remaining columns your UI shows
            resp = (
                supabase.table("users")
                .select(
                    "id, first_name, last_name, address, face_image, thumb_image"
                )
                .eq("id", best_hit["id"])
                .single()
                .execute()
            )
            if getattr(resp, "error", None):
                raise HTTPException(500, f"DB error → {resp.error}")

            user_row = resp.data       # dict with all columns

            return {
                "match": True,
                "user": user_row,                     # UI reads .user.first_name etc.
                "opencv_details": {                  # keep key name for UI
                    "good_matches": 0,               # not used in vector path
                    "match_ratio": best_hit["score"],
                    "avg_distance": 1 - best_hit["score"]
                },
                "search_info": {
                    "engine": "vector",
                    "searched_by": current_user.email
                }
            }
            # ---------------------------------------------------------------
        
        # Step 1: Hash-based bucketing (keeping your existing logic)
        print("📋 Step 1: Hash-based bucketing")
        
        hash_column = "face_hash" if req.type == "face" else "thumb_hash"
        bucket_column = "face_hash_bucket" if req.type == "face" else "thumb_hash_bucket"
        features_column = "face_features_orb" if req.type == "face" else "thumb_features_orb"
        
        search_hash = image_hash(req.image)
        print(f"🔢 Generated hash: {search_hash[:16]}... (showing first 16 bits)")
        
        bucket_res = supabase.rpc("get_hash_bucket", {"hash": search_hash}).execute()
        search_bucket = bucket_res.data
        if search_bucket is None:
            raise Exception("get_hash_bucket returned no data")
            
        print(f"🪣 Hash bucket: {search_bucket}")
        
        # Step 2: Get candidates from bucket
        print("📋 Step 2: Getting candidates from bucket")
        
        match_res = supabase.rpc("find_best_match", {
            "hash_column": hash_column,
            "bucket_column": bucket_column,
            "search_hash": search_hash,
            "search_bucket": search_bucket,
            "bucket_range": 10,
            "threshold": 100  # Increased threshold to get more candidates for OpenCV
        }).execute()
        
        if not match_res.data:
            print("❌ No candidates found in bucket")
            return {"match": False, "reason": "no_candidates_in_bucket"}
            
        candidates = match_res.data
        print(f"🎯 Found {len(candidates)} candidates from bucket")
        
        # Step 3: Extract features from search image
        print("📋 Step 3: Extracting features from search image")
        
        search_features, search_keypoints_count = extract_features(req.image)
        
        if search_features is None:
            print("❌ Could not extract features from search image")
            return {"match": False, "reason": "no_features_in_search_image"}
        
        # Decode search features (now using JSON format)
        decoded_data, data_type = safe_decode_features(search_features)
        if data_type == 'json':
            descriptors_dict = json.loads(decoded_data)
            search_descriptors = np.array(descriptors_dict['data'], dtype=descriptors_dict['dtype'])
        else:
            search_descriptors = pickle.loads(decoded_data)
        
        # Step 4: OpenCV feature matching with candidates
        print("📋 Step 4: OpenCV feature matching with candidates")
        
        best_match = None
        best_score = 0
        
        for i, candidate in enumerate(candidates):
            print(f"\n🔍 Checking candidate {i+1}/{len(candidates)} - User ID: {candidate.get('id', 'unknown')}")
            print(f"   Hash distance: {candidate.get('distance', 'unknown')}")
            
            # Get stored features for this candidate
            try:
                # You'll need to modify your RPC function to also return the features column
                # For now, let's assume you fetch it separately
                feature_res = supabase.table("users").select(features_column).eq("id", candidate["id"]).execute()
                
                if not feature_res.data or not feature_res.data[0][features_column]:
                    print(f"   ⚠️  No stored features found for this candidate")
                    continue
                    
                stored_features = feature_res.data[0][features_column]
                
                # Perform feature matching
                match_result = match_features(search_descriptors, stored_features)
                
                print(f"   📊 Match result: {match_result['good_matches']} good matches, ratio: {match_result['match_ratio']:.3f}")
                
                # Update best match if this is better
                if match_result["is_match"] and match_result["good_matches"] > best_score:
                    best_score = match_result["good_matches"]
                    best_match = {
                        "user": candidate,
                        "match_details": match_result
                    }
                    print(f"   🌟 NEW BEST MATCH! Score: {best_score}")
                    
            except Exception as e:
                print(f"   ❌ Error processing candidate: {e}")
                continue
        
        # Step 5: Return results
        print("\n📋 Step 5: Final results")
        
        if best_match:
            print(f"✅ MATCH FOUND!")
            print(f"   User: {best_match['user'].get('id', 'unknown')}")
            print(f"   Good matches: {best_match['match_details']['good_matches']}")
            print(f"   Match ratio: {best_match['match_details']['match_ratio']:.3f}")
            print(f"   Avg distance: {best_match['match_details']['avg_distance']:.2f}")
            
            return {
                "match": True,
                "user": best_match["user"],
                "opencv_details": best_match["match_details"],
                "search_info": {
                    "hash_bucket": search_bucket,
                    "candidates_checked": len(candidates),
                    "search_keypoints": search_keypoints_count,
                    "searched_by": current_user.email
                }
            }
        else:
            print("❌ NO MATCH FOUND")
            print(f"   Checked {len(candidates)} candidates")
            print(f"   Search image had {search_keypoints_count} keypoints")
            
            return {
                "match": False,
                "reason": "no_opencv_matches",
                "search_info": {
                    "hash_bucket": search_bucket,
                    "candidates_checked": len(candidates),
                    "search_keypoints": search_keypoints_count,
                    "searched_by": current_user.email
                }
            }
            
    except Exception as e:
        print(f"💥 Search failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/debug-features/{user_id}")
async def debug_stored_features(user_id: str, current_user: User = Depends(verify_jwt_token)):
    """Debug endpoint to check what's actually stored in the database"""
    try:
        print(f"🔍 Debugging stored features for user: {user_id}")
        print(f"👤 Requested by: {current_user.name} ({current_user.email})")
        
        # Get the user data
        result = supabase.table("users").select("*").eq("id", user_id).execute()
        
        if not result.data:
            return {"error": "User not found"}
        
        user_data = result.data[0]
        
        debug_info = {
            "user_id": user_id,
            "requested_by": current_user.email,
            "face_features_info": {},
            "thumb_features_info": {}
        }
        
        # Check face features
        if user_data.get("face_features_orb"):
            face_features = user_data["face_features_orb"]
            debug_info["face_features_info"] = {
                "exists": True,
                "type": str(type(face_features)),
                "length": len(face_features) if face_features else 0,
                "first_100_chars": str(face_features)[:100] if face_features else None,
                "starts_with_backslash_x": str(face_features).startswith('\\x') if face_features else False,
                "is_hex": all(c in '0123456789abcdefABCDEF\\x' for c in str(face_features)[:50]) if face_features else False
            }
            
            # Try to decode and deserialize
            try:
                decoded_data, data_type = safe_decode_features(str(face_features))
                debug_info["face_features_info"]["decode_success"] = True
                debug_info["face_features_info"]["data_type"] = data_type
                
                if data_type == 'json':
                    descriptors_dict = json.loads(decoded_data)
                    descriptors = np.array(descriptors_dict['data'], dtype=descriptors_dict['dtype'])
                    debug_info["face_features_info"]["descriptors_shape"] = descriptors.shape
                    debug_info["face_features_info"]["descriptors_type"] = str(descriptors.dtype)
                else:
                    descriptors = pickle.loads(decoded_data)
                    debug_info["face_features_info"]["descriptors_shape"] = descriptors.shape
                    debug_info["face_features_info"]["descriptors_type"] = str(descriptors.dtype)
                    
            except Exception as e:
                debug_info["face_features_info"]["decode_success"] = False
                debug_info["face_features_info"]["decode_error"] = str(e)
        else:
            debug_info["face_features_info"]["exists"] = False
        
        # Check thumb features (similar logic)
        if user_data.get("thumb_features_orb"):
            thumb_features = user_data["thumb_features_orb"]
            debug_info["thumb_features_info"] = {
                "exists": True,
                "type": str(type(thumb_features)),
                "length": len(thumb_features) if thumb_features else 0,
                "first_100_chars": str(thumb_features)[:100] if thumb_features else None,
                "starts_with_backslash_x": str(thumb_features).startswith('\\x') if thumb_features else False,
                "is_hex": all(c in '0123456789abcdefABCDEF\\x' for c in str(thumb_features)[:50]) if thumb_features else False
            }
            
            # Try to decode and deserialize
            try:
                decoded_data, data_type = safe_decode_features(str(thumb_features))
                debug_info["thumb_features_info"]["decode_success"] = True
                debug_info["thumb_features_info"]["data_type"] = data_type
                
                if data_type == 'json':
                    descriptors_dict = json.loads(decoded_data)
                    descriptors = np.array(descriptors_dict['data'], dtype=descriptors_dict['dtype'])
                    debug_info["thumb_features_info"]["descriptors_shape"] = descriptors.shape
                    debug_info["thumb_features_info"]["descriptors_type"] = str(descriptors.dtype)
                else:
                    descriptors = pickle.loads(decoded_data)
                    debug_info["thumb_features_info"]["descriptors_shape"] = descriptors.shape
                    debug_info["thumb_features_info"]["descriptors_type"] = str(descriptors.dtype)
                    
            except Exception as e:
                debug_info["thumb_features_info"]["decode_success"] = False
                debug_info["thumb_features_info"]["decode_error"] = str(e)
        else:
            debug_info["thumb_features_info"]["exists"] = False
        
        return debug_info
        
    except Exception as e:
        print(f"❌ Debug error: {e}")
        return {"error": str(e)}