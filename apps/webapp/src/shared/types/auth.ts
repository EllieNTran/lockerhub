export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  hasSeenTutorial: boolean;
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
