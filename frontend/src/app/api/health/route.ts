import { NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      return NextResponse.json(
        { error: "Backend URL not configured" },
        { status: 500 },
      );
    }

    const response = await axios.get(`${backendUrl}/health`);
    return NextResponse.json(response.data, { status: 200 });
  } catch (error: unknown) {
    const message = axios.isAxiosError(error)
      ? error.message
      : "Failed to fetch health";
    console.error("Error fetching health:", message);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
