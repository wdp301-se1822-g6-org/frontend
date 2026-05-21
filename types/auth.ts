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
};
