import { NextRequest, NextResponse } from "next/server";

const METHODS_WITHOUT_BODY = new Set(["GET", "HEAD"]);
const REQUEST_HEADERS_TO_STRIP = new Set(["host", "content-length"]);
const RESPONSE_HEADERS_TO_STRIP = new Set(["content-length"]);

function getBackendUrl() {
  return process.env.BACKEND_URL?.trim().replace(/\/+$/, "");
}

function buildTargetUrl(request: NextRequest, path: string[]) {
  const backendUrl = getBackendUrl();

  if (!backendUrl) {
    throw new Error("Backend URL not configured");
  }

  const normalizedPath = path.map(encodeURIComponent).join("/");
  return `${backendUrl}/api/v1/${normalizedPath}${request.nextUrl.search}`;
}

function getForwardHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  REQUEST_HEADERS_TO_STRIP.forEach((header) => headers.delete(header));
  headers.set("x-forwarded-host", request.nextUrl.host);
  headers.set("x-forwarded-proto", request.nextUrl.protocol.replace(":", ""));

  return headers;
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  try {
    const { path } = await params;
    const targetUrl = buildTargetUrl(request, path);
    const method = request.method.toUpperCase();
    const headers = getForwardHeaders(request);

    const init: RequestInit = {
      method,
      headers,
      redirect: "manual",
    };

    if (!METHODS_WITHOUT_BODY.has(method)) {
      init.body = Buffer.from(await request.arrayBuffer());
    }

    const response = await fetch(targetUrl, init);
    const responseHeaders = new Headers(response.headers);
    RESPONSE_HEADERS_TO_STRIP.forEach((header) => responseHeaders.delete(header));

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to reach backend";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export { proxyRequest as GET };
export { proxyRequest as POST };
export { proxyRequest as PUT };
export { proxyRequest as PATCH };
export { proxyRequest as DELETE };
export { proxyRequest as OPTIONS };
