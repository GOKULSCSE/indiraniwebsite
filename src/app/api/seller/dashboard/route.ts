import { DashboardController } from "@/modules/controllers/DashboardController";

const dashboardController = new DashboardController();

export function GET(request: Request) {
    return dashboardController.getDashboardStats(request);
}
