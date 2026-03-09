import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("apps/SignupPage.tsx"),
  route("login", "apps/LoginPage.tsx"),
  route("user", "apps/user/pages/HomePage.tsx"),
  route("admin", "apps/admin/pages/HomePage.tsx"),
] satisfies RouteConfig;
