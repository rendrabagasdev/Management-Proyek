export interface MobileJwt {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}
