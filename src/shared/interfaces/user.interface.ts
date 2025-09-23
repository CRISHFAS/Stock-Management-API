import { MercadoLibreToken } from './ml-token.interface';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  mlToken?: MercadoLibreToken;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface UserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  hasMLConnection: boolean;
}
