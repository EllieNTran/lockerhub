export interface User {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  password_hash: string | null;
  role: string;
  staff_number: string | null;
  department_id: string | null;
  office?: string | null;
  is_pre_registered?: boolean;
  account_activated?: boolean;
  has_seen_tutorial: boolean;
  created_at: Date;
}

export interface UserResponse {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  hasSeenTutorial: boolean;
}
