import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import sharp from "sharp";

async function imageHash(base64: string) {
  const buffer = Buffer.from(base64.split(",")[1], "base64");
  const resized = await sharp(buffer).resize(8, 8).grayscale().raw().toBuffer();
  // Simple average hash: each pixel > mean is 1, else 0
  const mean = resized.reduce((a, b) => a + b, 0) / resized.length;
  let hash = "";
  for (const pixel of resized) {
    hash += pixel > mean ? "1" : "0";
  }
  // Pad to 64 bits if needed
  return hash.padStart(64, "0");
}

export async function POST(req: NextRequest) {
  const { image, type } = await req.json();
  if (!image || !type) return NextResponse.json({ match: false });

  const searchHash = await imageHash(image);
  console.log('search hash :', searchHash);
  
  const hashColumn = type === "face" ? "face_hash" : "thumb_hash";
  const bucketColumn = type === "face" ? "face_hash_bucket" : "thumb_hash_bucket";

  // Get the bucket for the search hash
  const { data: bucketData, error: bucketError } = await supabase.rpc("get_hash_bucket", {
    hash: searchHash
  });

  if (bucketError) {
    console.error('Error getting bucket:', bucketError);
    return NextResponse.json({ match: false });
  }

  const searchBucket = bucketData;
  console.log('Search bucket',  searchBucket);
  
  const bucketRange = 1; // Search in current bucket and adjacent buckets
  const threshold = 10;

  // Use a single SQL query to get the best match by Hamming distance
  const { data: bestMatch, error: matchError } = await supabase.rpc("find_best_match", {
    hash_column: hashColumn,
    bucket_column: bucketColumn,
    search_hash: searchHash,
    search_bucket: searchBucket,
    bucket_range: bucketRange,
    threshold: threshold
  });

  if (matchError) {
    console.error('Error finding best match:', matchError);
    return NextResponse.json({ match: false });
  }

  if (!bestMatch || bestMatch.length === 0) {
    return NextResponse.json({ match: false });
  }

  const user = bestMatch[0];
  if (user.distance < threshold) {
    return NextResponse.json({ match: true, user, distance: user.distance });
  } else {
    return NextResponse.json({ match: false });
  }
}
