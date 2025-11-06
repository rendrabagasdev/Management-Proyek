import { generateMobileJwt } from "@/lib/auth-mobile";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextResponse } from "next/server";

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Handle OPTIONS preflight request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const response = await prisma.user.findUnique({
      where: { email },
    });

    if (response?.globalRole !== "MEMBER") {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401, headers: corsHeaders }
      );
    }

    if (!response || !response.passwordHash) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401, headers: corsHeaders }
      );
    }

    const isPasswordValid = await compare(password, response.passwordHash);

    if (!isPasswordValid)
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401, headers: corsHeaders }
      );

    const token = await generateMobileJwt({
      email: response.email,
      userId: String(response.id),
      role: response.globalRole,
    });

    return NextResponse.json(
      {
        message: "Login successful",
        token: token,
        user: {
          id: response.id,
          name: response.name,
          email: response.email,
          globalRole: response.globalRole,
        },
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
