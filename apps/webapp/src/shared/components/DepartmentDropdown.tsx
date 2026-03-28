import { Briefcase } from 'lucide-react';
import { useDepartments } from '@/services/auth';
import CustomDropdown from './CustomDropdown';

interface DepartmentDropdownProps {
  value: string;
  onChange: (departmentId: string) => void;
  showAllOption?: boolean;
  className?: string;
  highlightSelected?: boolean;
}

const DepartmentDropdown = ({ value, onChange, showAllOption = true, className, highlightSelected = false }: DepartmentDropdownProps) => {
  const { data: departmentsData = [], isLoading: departmentsLoading } = useDepartments();

  const departmentItems = departmentsData
    .filter(department => department.id && department.name)
    .map(department => ({
      id: department.id,
      label: department.name,
    }));

  return (
    <CustomDropdown
      value={value}
      onChange={onChange}
      items={departmentItems}
      isLoading={departmentsLoading}
      icon={Briefcase}
      placeholder="Select department"
      allOptionLabel="All Departments"
      showAllOption={showAllOption}
      className={className}
      highlightSelected={highlightSelected}
    />
  );
};

export default DepartmentDropdown;
