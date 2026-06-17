export const SESSION_COOKIE_NAME = "contract_generator_session";

export const POST_LOGIN_REDIRECT = "/dashboard";

export const PUBLIC_ROUTES = ["/login"] as const;

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/lawyer",
  "/admin",
] as const;

export const LAWYER_ROUTE_PREFIXES = ["/lawyer"] as const;

export const ADMIN_STAFF_ROUTE_PREFIXES = ["/admin"] as const;

export const MIN_SESSION_SECRET_LENGTH = 32;

export const BCRYPT_COST = 12;
