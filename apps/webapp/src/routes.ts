import { type RouteConfig, index, route } from '@react-router/dev/routes';

export default [
  index('apps/Login.tsx'),
  route('signup', 'apps/Signup.tsx'),
  route('check-account', 'apps/CheckAccount.tsx'),
  route('reset-password', 'apps/ResetPassword.tsx'),

  route('user', 'apps/user/pages/Home.tsx'),
  route('user/book', 'apps/user/pages/BookLocker.tsx'),
  route('user/my-bookings', 'apps/user/pages/Bookings.tsx'),
  route('user/special-request', 'apps/user/pages/SpecialRequests.tsx'),
  route('user/special-request/new', 'apps/user/pages/NewSpecialRequest.tsx'),
  route('user/return-key', 'apps/user/pages/ReturnKey.tsx'),

  route('admin', 'apps/admin/pages/Home.tsx'),
  route('admin/bookings', 'apps/admin/pages/Bookings.tsx'),
  route('admin/lockers', 'apps/admin/pages/Lockers.tsx'),
  route('admin/special-requests', 'apps/admin/pages/SpecialRequests.tsx'),
  route('admin/analytics', 'apps/admin/pages/Analytics.tsx'),
  route('admin/audit', 'apps/admin/pages/AuditLogs.tsx'),
  route('admin/rules', 'apps/admin/pages/BookingRules.tsx'),
  route('admin/locker-configuration', 'apps/admin/pages/LockerConfiguration.tsx'),
] satisfies RouteConfig;
