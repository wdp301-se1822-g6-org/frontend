export type UserRegister = {
  email: string;
  password: string;
  name: string;
  phone: string;
  dateOfBirth: Date;
};

export type UserLogin = {
  email: string;
  password: string;
};

export type User = {
  id: string;
  role: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  avatarUrl?: string;
  name: string;
  isActive: boolean;
  tier?: string;
  loyaltyPoints?: number;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  emailVerified?: boolean;
};

export interface OtpSendDto {
  email: string;
}

export interface OtpSendResponse {
  message: string;
  token?: string;
}

export interface OtpVerifyDto {
  email: string;
  code: string; // 6-digit verification code
}

export interface OtpVerifyResponse {
  token: string; // JWT token with scope=email_verified (15m TTL)
}
