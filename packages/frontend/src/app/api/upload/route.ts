import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create a new FormData instance for Pinata
    const pinataFormData = new FormData();
    pinataFormData.append("file", file);

    // Add metadata
    const metadata = JSON.stringify({
      name: file.name,
    });
    pinataFormData.append("pinataMetadata", metadata);

    // Add options
    const options = JSON.stringify({
      cidVersion: 1,
    });
    pinataFormData.append("pinataOptions", options);

    // Log the request details (excluding sensitive data)
    console.log("Uploading file:", {
      name: file.name,
      size: file.size,
      type: file.type,
    });

    // Check if JWT token is available
    if (!process.env.PINATA_JWT) {
      console.error("PINATA_JWT is not set in environment variables");
      throw new Error("Pinata configuration is missing");
    }

    // Log token format (without exposing the actual token)
    // const token = process.env.PINATA_JWT;
    // console.log("JWT Token format check:", {
    //   length: token.length,
    //   startsWith: token.substring(0, 10) + "...",
    //   format: token.split('.').length === 3 ? "Valid JWT format" : "Invalid JWT format"
    // });

    // Upload to Pinata
    const response = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
      },
      body: pinataFormData,
    });

    // Log the response status and headers
    console.log("Pinata response status:", response.status);
    console.log("Pinata response headers:", Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Pinata upload failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      });

      // Handle specific error cases
      if (response.status === 403) {
        throw new Error("Pinata authentication failed. Please check your JWT token.");
      } else if (response.status === 401) {
        throw new Error("Pinata token is invalid or expired.");
      } else {
        throw new Error(`Failed to upload to Pinata: ${response.statusText}`);
      }
    }

    const data = await response.json();
    console.log("Pinata upload successful:", data);

    const url = `${process.env.GATEWAY_URL}/ipfs/${data.IpfsHash}`;
    
    return NextResponse.json({ url }, { status: 200 });
  } catch (error: unknown) {
    console.error("Upload error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload file" },
      { status: 500 }
    );
  }
} 