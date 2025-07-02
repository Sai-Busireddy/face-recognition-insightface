import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { performance } from "perf_hooks";
import * as dotenv from "dotenv";
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error("Missing required environment variables");
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Generate image hash (same as in the main application)
async function imageHash(base64: string) {
  const buffer = Buffer.from(base64.split(",")[1], "base64");
  const resized = await sharp(buffer).resize(8, 8).grayscale().raw().toBuffer();
  // Simple average hash: each pixel > mean is 1, else 0
  const mean = resized.reduce((a, b) => a + b, 0) / resized.length;
  let hash = "";
  for (const pixel of resized) {
    hash += pixel > mean ? "1" : "0";
  }
  return hash.padStart(64, "0");
}

// Generate a random base64 image with more variation
async function generateRandomImage(): Promise<string> {
  const width = 100;
  const height = 100;
  // Generate random pixel data
  const raw = Buffer.alloc(width * height * 3);
  for (let i = 0; i < raw.length; i++) {
    raw[i] = Math.floor(Math.random() * 256);
  }
  const buffer = await sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg()
    .toBuffer();
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

async function generateTestData(count: number) {
  console.log(`Generating ${count} test records...`);
  const startTime = performance.now();

  // First, create auth records
  console.log('Creating auth records...');
  const authData = Array.from({ length: count }, (_, i) => {
    const randomString = Math.random().toString(36).substring(2, 8); // generates random alphanumeric string
    return {
      id: uuidv4(),
      name: `testuser${i}_${randomString}`,
      email: `testuser${i}_${randomString}@example.com`,
      password: `testpassword${i}`,
    };
  });

  const { data: authRecords, error: authError } = await supabase
    .from("auth")
    .insert(authData)
    .select();

  if (authError) {
    console.error("Error inserting auth records:", authError);
    return;
  }

  console.log('Auth records created successfully. Generating user data...');

  const testData = await Promise.all(
    authRecords.map(async (auth, i) => {
      const faceImage = await generateRandomImage();
      const thumbImage = await generateRandomImage();
      
      // Generate hashes for both images
      const faceHash = await imageHash(faceImage);
      const thumbHash = await imageHash(thumbImage);

      return {
        auth_id: auth.id,
        first_name: `Test${i}`,
        last_name: `User${i}`,
        address: `Test Address ${i}`,
        additional_info: `Additional info for user ${i}`,
        face_image: faceImage,
        thumb_image: thumbImage,
        face_hash: faceHash,
        thumb_hash: thumbHash,
        // Buckets will be automatically calculated by the database trigger
      };
    })
  );

  console.log('Generated test data with hashes. Inserting into database...');
  const { data, error } = await supabase.from("users").insert(testData);
  
  if (error) {
    console.error("Error inserting test data:", error);
    return;
  }

  const endTime = performance.now();
  console.log(`Inserted ${count} records with hashes in ${(endTime - startTime).toFixed(2)}ms`);
  return data;
}

async function main() {
  try {
    // Generate test data
    await generateTestData(400);
  } catch (error) {
    console.error("Error in test:", error);
  }
}

main(); 