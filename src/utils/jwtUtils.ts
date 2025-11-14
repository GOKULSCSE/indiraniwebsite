import { JWTPayload, SignJWT, jwtVerify } from "jose";

export class JwtUtils {
  private static Secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET!);

  static async generateToken(payload: JWTPayload): Promise<string> {
    return await new SignJWT(payload)
      .setProtectedHeader({ alg: "HS256" })
      .sign(JwtUtils.Secret);
  }

  static async validateToken<T>(token: string): Promise<T | null> {
    try {
      const { payload } = await jwtVerify(token, JwtUtils.Secret, { algorithms: ["HS256"] });
      return payload as T;
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  }
}
