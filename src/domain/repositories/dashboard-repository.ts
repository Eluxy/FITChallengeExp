import type { DashboardStats } from "@/src/domain/entities/dashboard";

export interface DashboardRepository {
  getDashboardStats(): Promise<DashboardStats>;
}

