import { NextResponse } from "next/server";
import { DashboardService } from "../services/DashboardService";
import { ResponseGenerator } from "@/utils/responseGenerator";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  async getDashboardStats(request: Request) {
    try {
      const userData = request.headers.get("x-user");
      console.log("userData🤞🤞",userData);
      
      const user: { id: string | null; sellerId: string | null } = userData ? JSON.parse(userData) : null;
      console.log("user🤞🤞",user);

      if (!user?.sellerId) throw new Error("Seller Not Found");
      const result = await this.dashboardService.getDashboardStats(user.sellerId);

      
      return NextResponse.json(
        ...ResponseGenerator.generate(200, result, "Dashboard stats fetched successfully")
      );
    } catch (error: unknown) {
      let errorMessage = "An unknown error occurred";
      let statusCode = 500;
      if (error instanceof Error) {
        errorMessage = error.message;
        if ('status' in error && typeof (error as any).status === 'number') {
          statusCode = (error as any).status;
        }
      }
      return NextResponse.json(
        ...ResponseGenerator.generate(statusCode, null, errorMessage)
      );
    }
  }
} 