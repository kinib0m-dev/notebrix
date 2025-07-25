import { authRouter } from "@/lib/auth/server/procedures";
import { createTRPCRouter } from "../init";
import { adminRouter } from "@/lib/admin/server/procedures";
import { subjectsRouter } from "@/lib/subjects/server/procedures";

export const appRouter = createTRPCRouter({
  auth: authRouter,
  // Admin
  admin: adminRouter,
  // Subjects
  subjects: subjectsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
