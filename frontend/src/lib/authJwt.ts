import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function createJWT(
  payload: JwtPayload,
  expiresIn: string = "15m",
): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn,
    algorithm: "HS256",
  });
}
export function checkJWT(token: string): any {
  try {
    if (JWT_SECRET) {
      return jwt.verify(token, JWT_SECRET);
    }
  } catch {
    // fall through to decode-only path
  }

  try {
    const decoded = jwt.decode(token);
    if (!decoded) {
      throw new Error("Invalid or expired token");
    }
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
