export interface Department {
  department_id: string
  name: string
  floor_id: string
}

export interface CreateDepartmentData {
  name: string
  floor_id: string
}

export interface UpdateDepartmentData {
  name?: string
  floor_id?: string
}
