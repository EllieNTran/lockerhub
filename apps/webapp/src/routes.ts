import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("apps/Login.tsx"),
  route("signup", "apps/Signup.tsx"),
  route("check-account", "apps/CheckAccount.tsx"),
  route("reset-password", "apps/ResetPassword.tsx"),
  route("user", "apps/user/pages/Home.tsx"),
  route("user/book", "apps/user/pages/BookLocker.tsx"),
  route("user/my-bookings", "apps/user/pages/MyBookings.tsx"),
  route("user/special-request", "apps/user/pages/SpecialRequest.tsx"),
  route("user/return-key", "apps/user/pages/ReturnKey.tsx"),
  route("admin", "apps/admin/pages/Home.tsx"),
  route("admin/locker-configuration", "apps/admin/pages/LockerConfiguration.tsx"),
] satisfies RouteConfig;
