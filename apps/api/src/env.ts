export const env = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
  cookieName: "reactcode_token",
};
