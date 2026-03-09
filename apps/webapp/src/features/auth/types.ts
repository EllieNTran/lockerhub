export type UserRole = 'admin' | 'user'

export interface SignupResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface SignupRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  staffNumber?: string;
  departmentId?: string;
  office?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface User {
  user_id: string
  first_name: string
  last_name: string
  staff_number: string | null
  department_id: string | null
  email: string
  role: UserRole
  created_at: string
  updated_at: string
}

export interface CreateUserData {
  first_name: string
  last_name: string
  staff_number?: string
  department_id?: string
  email: string
  password: string
  role?: UserRole
}

export interface UpdateUserData {
  first_name?: string
  last_name?: string
  staff_number?: string
  department_id?: string
  email?: string
  password?: string
  role?: UserRole
}
