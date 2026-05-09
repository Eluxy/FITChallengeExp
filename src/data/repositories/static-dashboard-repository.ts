import type { DashboardStats } from "@/src/domain/entities/dashboard";
import type { DashboardRepository } from "@/src/domain/repositories/dashboard-repository";

const DASHBOARD_STATS: DashboardStats = {
  progressPercent: 100,
  stepsPercent: 100,
  caloriesPercent: 100,
};

export class StaticDashboardRepository implements DashboardRepository {
  async getDashboardStats(): Promise<DashboardStats> {
    return DASHBOARD_STATS;
  }
}

