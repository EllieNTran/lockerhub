export type UserRole = 'admin' | 'user'

export interface AuthUser {
  user_id: string
  first_name: string
  last_name: string
  staff_number: string | null
  department_id: string | null
  email: string
  role: UserRole
  created_at: string
  updated_at: string
  has_seen_tutorial: boolean
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
