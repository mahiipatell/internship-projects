import dotenv from "dotenv";

dotenv.config();

function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),
  jwtSecret: required("JWT_SECRET", process.env.JWT_SECRET),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET),
  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 7),
};

export const isProd = config.nodeEnv === "production";
