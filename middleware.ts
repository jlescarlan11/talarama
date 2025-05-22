export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/movies/new", "/movies/edit/:id+"],
};
