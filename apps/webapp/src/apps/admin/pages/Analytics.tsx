import { useState } from 'react';
import { format } from 'date-fns';
import { Building2, BriefcaseBusiness, ChartArea, Clock, Filter } from 'lucide-react';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, PieChart, Pie, BarChart, Bar } from 'recharts';
import AdminLayout from '../layout/AdminLayout';
import Heading from '@/components/Heading';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { useLockerUsage, useTopDepartments, useMostPopularFloors, type Period } from '@/services/analytics';
import FloorDropdown from '@/components/FloorDropdown';
import CustomDropdown from '@/components/CustomDropdown';
import DepartmentDropdown from '@/components/DepartmentDropdown';

const chartConfig = {
  occupied: {
    label: 'Occupied Lockers',
    color: 'var(--color-secondary)',
  },
};

const COLORS = [
  'var(--color-primary)',
  'var(--color-secondary)',
  'var(--color-dark-blue)',
  'var(--color-purple)',
  'var(--color-pink)',
  'var(--color-baby-blue)',
];

const PERIOD_OPTIONS = [
  { value: 'last_7_days', label: 'Last 7 Days' },
  { value: 'last_14_days', label: 'Last 14 Days' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_3_months', label: 'Last 3 Months' },
  { value: 'last_6_months', label: 'Last 6 Months' },
  { value: 'last_year', label: 'Last Year' },
  { value: 'last_2_years', label: 'Last 2 Years' },
  { value: 'all_time', label: 'All Time' },
];

const LockerAnalytics = () => {
  const [period, setPeriod] = useState<Period>('last_7_days');
  const [usageFloorFilter, setUsageFloorFilter] = useState<string>('all');
  const [usageDepartmentFilter, setUsageDepartmentFilter] = useState<string>('all');
  const [topDeptFloorFilter, setTopDeptFloorFilter] = useState<string>('all');
  const [topFloorDeptFilter, setTopFloorDeptFilter] = useState<string>('all');

  const { data, isLoading, isError } = useLockerUsage({
    period,
    floor_id: usageFloorFilter !== 'all' ? usageFloorFilter : undefined,
    department_id: usageDepartmentFilter !== 'all' ? usageDepartmentFilter : undefined,
  });

  const { data: topDepartmentsRaw } = useTopDepartments({
    period,
    floor_id: topDeptFloorFilter !== 'all' ? topDeptFloorFilter : undefined,
  });

  const { data: topFloorsRaw } = useMostPopularFloors({
    period,
    department_id: topFloorDeptFilter !== 'all' ? topFloorDeptFilter : undefined,
  });

  const chartData = data?.map((item) => ({
    date: format(new Date(item.usage_date), 'MMM dd'),
    fullDate: item.usage_date,
    occupied: item.occupied_count,
  }));

  const topDepartmentsData = topDepartmentsRaw?.map((dept, index) => ({
    name: dept.department_name,
    value: dept.occupied_count,
    fill: COLORS[index % COLORS.length],
  })) || [];

  const topFloorsData = topFloorsRaw?.map((floor) => ({
    floor: `Floor ${floor.floor_number}`,
    bookings: floor.occupied_count,
  })) || [];

  return (
    <AdminLayout>
      <main className="w-full space-y-6">
        <Heading
          title="Locker Analytics"
          description="Detailed locker usage insights by date, department and floor."
        />

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-5 stroke-3 text-grey" />
            <p>Filter</p>
          </div>
          <CustomDropdown
            value={period}
            onChange={(val) => setPeriod(val as Period)}
            items={PERIOD_OPTIONS.map(opt => ({ id: opt.value, label: opt.label }))}
            icon={Clock}
            placeholder="Select period"
            showAllOption={false}
          />
        </div>

        <div className="bg-white border border-grey-outline rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-medium">Locker Usage</h3>
            <div className="flex items-center gap-4">
              <FloorDropdown value={usageFloorFilter} onChange={setUsageFloorFilter} />
              <DepartmentDropdown value={usageDepartmentFilter} onChange={setUsageDepartmentFilter} />
            </div>
          </div>

          {isLoading && (
            <div className="h-[400px] flex items-center justify-center text-grey">
              Loading chart data...
            </div>
          )}

          {isError && (
            <div className="h-[400px] flex flex-col items-center justify-center text-center text-grey/40">
              <ChartArea className="h-15 w-15 mb-4" />
              <p className="text-md">Failed to load analytics data</p>
            </div>
          )}

          {!isLoading && !isError && chartData && chartData.length > 0 && (
            <ChartContainer config={chartConfig} className="h-[400px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorOccupied" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-occupied)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-occupied)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-grey-outline/30" />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-grey"
                  interval={Math.max(0, Math.floor(chartData.length / 14) - 1)}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  className="text-grey"
                  allowDecimals={false}
                  domain={[0, (dataMax: number) => Math.ceil(dataMax)]}
                />
                <ChartTooltip
                  content={
                    <ChartTooltipContent
                      labelFormatter={(value, payload) => {
                        if (payload && Array.isArray(payload) && payload[0]?.payload?.fullDate) {
                          return format(new Date(payload[0].payload.fullDate), 'MMMM dd, yyyy');
                        }
                        return String(value);
                      }}
                      formatter={(value) => `${value} bookings`}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="occupied"
                  stroke="var(--color-occupied)"
                  strokeWidth={2}
                  fill="url(#colorOccupied)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ChartContainer>
          )}

          {!isLoading && !isError && (!chartData || chartData.length === 0) && (
            <div className="h-[400px] flex flex-col items-center justify-center text-center text-grey/40">
              <ChartArea className="h-15 w-15 mb-4" />
              <p className="text-md">Locker usage data not found</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          <div className="bg-white border border-grey-outline rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium">Top Departments</h3>
              <FloorDropdown value={topDeptFloorFilter} onChange={setTopDeptFloorFilter} />
            </div>
            {topDepartmentsRaw && topDepartmentsRaw.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <PieChart>
                  <Pie
                    data={topDepartmentsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={(entry) => entry.name}
                  />
                  <ChartTooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-light-grey text-white bg-primary p-2 shadow-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium">{data.name}</span>
                              <span className="text-xs">{data.value} bookings</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ChartContainer>
              ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-grey/40">
                <BriefcaseBusiness className="h-15 w-15 mb-4" />
                <p className="text-md">Top department data not found</p>
              </div>
            )}
          </div>

          <div className="bg-white border border-grey-outline rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-medium">Most Popular Floors</h3>
              <DepartmentDropdown value={topFloorDeptFilter} onChange={setTopFloorDeptFilter} />
            </div>
            {topFloorsRaw && topFloorsRaw.length > 0 ? (
              <ChartContainer config={{}} className="h-[300px] w-full">
                <BarChart data={topFloorsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-grey-outline/30" />
                  <XAxis type="number" />
                  <YAxis dataKey="floor" type="category" width={80} />
                  <ChartTooltip
                    content={({ payload }) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-light-grey text-white bg-primary p-2 shadow-sm">
                            <div className="flex flex-col gap-1">
                              <span className="text-xs font-medium">{data.floor}</span>
                              <span className="text-xs">{data.bookings} bookings</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="bookings" fill="var(--color-primary)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ChartContainer>
              ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center text-grey/40">
                <Building2 className="h-15 w-15 mb-4" />
                <p className="text-md">Most popular floor data not found</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </AdminLayout>
  );
};

export default LockerAnalytics;
