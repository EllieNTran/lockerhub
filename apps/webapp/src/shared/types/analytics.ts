export interface LockerUsageData {
  usage_date: string;
  occupied_count: number;
}

export interface TopDepartmentData {
  department_id: string;
  department_name: string;
  occupied_count: number;
}

export interface MostPopularFloorData {
  floor_id: string;
  floor_number: string;
  occupied_count: number;
}
