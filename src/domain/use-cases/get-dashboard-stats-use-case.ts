import type { DashboardStats } from "@/src/domain/entities/dashboard";
import type { DashboardRepository } from "@/src/domain/repositories/dashboard-repository";

export class GetDashboardStatsUseCase {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  execute(): Promise<DashboardStats> {
    return this.dashboardRepository.getDashboardStats();
  }
}

