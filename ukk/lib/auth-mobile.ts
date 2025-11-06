import { MobileJwt } from "@/types/mobile-auth";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";

export async function verifyMobileJwt(token: string): Promise<MobileJwt> {
  try {
    const secret = process.env.MOBILE_JWT_SECRET || "your-mobile-secret-key";
    const decode = jwt.verify(token, secret) as MobileJwt;
    if (!decode) {
      throw new Error("Invalid token");
    }
    return decode;
  } catch (error) {
    console.error("JWT verification failed:", error);
    throw new Error("Invalid or expired token");
  }
}

export async function generateMobileJwt(payload: MobileJwt): Promise<string> {
  const secret = process.env.MOBILE_JWT_SECRET || "your-mobile-secret-key";
  const token = jwt.sign(payload, secret, { expiresIn: "7d" });
  return token;
}

export async function ExtractMobileJwtFromRequest(token: string) {
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  try {
    const parts = token.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const decoded = await verifyMobileJwt(parts[1]);
    return decoded;
  } catch (error) {
    return NextResponse.json(
      { message: "Unauthorized", error: error },
      { status: 401 }
    );
  }
}
