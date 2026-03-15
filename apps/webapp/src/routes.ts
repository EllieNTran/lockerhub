import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("apps/LoginPage.tsx"),
  route("signup", "apps/SignupPage.tsx"),
  route("check-account", "apps/CheckAccountPage.tsx"),
  route("reset-password", "apps/ResetPasswordPage.tsx"),
  route("user", "apps/user/pages/HomePage.tsx"),
  route("user/book", "apps/user/pages/BookLockerPage.tsx"),
  route("admin", "apps/admin/pages/HomePage.tsx"),
  route("admin/locker-configuration", "apps/admin/pages/LockerConfigurationPage.tsx"),
] satisfies RouteConfig;
