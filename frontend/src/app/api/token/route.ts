import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

// In-memory cache for generated tokens (you could also use Redis, database, etc.)
const tokenCache = new Map<string, { token: string; expires: number }>();

export async function GET(req: NextRequest) {
  try {
    const nextAuthToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    
    if (!nextAuthToken) {
      return NextResponse.json({ status: 401, msg: "Unauthorized" });
    }

    // Create a unique cache key based on user session
    const cacheKey = `${nextAuthToken.id || nextAuthToken.sub}_${nextAuthToken.email}`;
    
    // Check if we have a valid cached token
    const cachedEntry = tokenCache.get(cacheKey);
    const now = Math.floor(Date.now() / 1000);
    
    if (cachedEntry && cachedEntry.expires > now + 300) { // 5 minute buffer before expiry
      return NextResponse.json({ 
        status: 200,
        token: cachedEntry.token
      });
    }

    // Generate new JWT token
    const expiresAt = now + (24 * 60 * 60); // 24 hours
    const jwtToken = jwt.sign(
      { 
        id: nextAuthToken.id || nextAuthToken.sub, 
        email: nextAuthToken.email, 
        name: nextAuthToken.name,
        exp: expiresAt
      },
      process.env.NEXTAUTH_SECRET!
    );

    // Cache the token
    tokenCache.set(cacheKey, {
      token: jwtToken,
      expires: expiresAt
    });

    // Clean up expired entries occasionally
    if (Math.random() < 0.1) { // 10% chance to cleanup
      for (const [key, entry] of tokenCache.entries()) {
        if (entry.expires <= now) {
          tokenCache.delete(key);
        }
      }
    }

    return NextResponse.json({ 
      status: 200,
      token: jwtToken
    });
    
  } catch (error) {
    console.error('Token generation error:', error);
    return NextResponse.json({ 
      status: 500, 
      msg: "Internal server error" 
    });
  }
}