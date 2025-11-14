import db from "../../lib/db";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  subYears,
  format,
  eachDayOfInterval,
} from "date-fns";
import { Decimal } from "@prisma/client/runtime/library";

// Define types for order items
type OrderItemWithPayment = {
  id: string;
  priceAtPurchase: Decimal;
  isRefunded: boolean;
  refundedAmount: Decimal | null;
  shippingCharge: Decimal | null;
  gstAmountAtPurchase: Decimal | null;
  createdAt: Date;
  order: {
    payments: {
      paymentDate: Date | null;
    }[];
  };
};

export class DashboardService {
  async getDashboardStats(sellerId: string) {
    // Dates
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);
    const lastMonthStart = startOfMonth(subMonths(now, 1));
    const lastMonthEnd = endOfMonth(subMonths(now, 1));
    const lastYearStart = startOfYear(subYears(now, 1));
    const lastYearEnd = endOfYear(subYears(now, 1));

    // Total unique users who have purchased from this seller
    const totalUsers = await db.orderItem
      .findMany({
        where: {
          sellerId: sellerId,
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      })
      .then((users) => users.length);

    // Total Orders (count of order items for this seller)
    const totalOrders = await db.orderItem.count({
      where: {
        sellerId,
      },
    });

    // Get all order items
    const orderItems = await db.orderItem.findMany({
      where: {
        sellerId,
      },
      select: {
        id: true,
        priceAtPurchase: true,
        isRefunded: true,
        refundedAmount: true,
        shippingCharge: true,
        gstAmountAtPurchase: true,
        createdAt: true,
        order: {
          select: {
            payments: {
              select: {
                paymentDate: true,
              },
            },
          },
        },
      },
    });

    // Calculate total metrics
    let totalSales = 0;
    let totalRefund = 0;
    let totalShippingCharge = 0;
    let totalGST = 0;

    for (const item of orderItems) {
      // For each item, calculate its contribution to sales
      if (item.isRefunded) {
        // If refunded, calculate the difference
        const price = Number(item.priceAtPurchase) || 0;
        const refunded = Number(item.refundedAmount) || 0;
        totalSales += price - refunded;
        totalRefund += refunded;
      } else {
        // If not refunded, use the full price
        totalSales += Number(item.priceAtPurchase) || 0;
      }

      // Add shipping and GST
      totalShippingCharge += Number(item.shippingCharge) || 0;
      totalGST += Number(item.gstAmountAtPurchase) || 0;
    }

    // Create a map of order items by date for calculating weekly and monthly overviews
    const orderItemsByDate = new Map<string, OrderItemWithPayment[]>();
    
    // Organize order items by date
    orderItems.forEach((item: OrderItemWithPayment) => {
      // Use the first payment date if available, otherwise use the created date
      const date = item.order.payments[0]?.paymentDate || item.createdAt;
      const dateStr = format(date, "yyyy-MM-dd");
      
      if (!orderItemsByDate.has(dateStr)) {
        orderItemsByDate.set(dateStr, []);
      }
      
      orderItemsByDate.get(dateStr)!.push(item);
    });

    // Income Overview (weekly)
    const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const weekly = weekDays.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const items = orderItemsByDate.get(dateStr) || [];
      
      let dailyTotal = 0;
      items.forEach((item: OrderItemWithPayment) => {
        if (item.isRefunded) {
          dailyTotal += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
        } else {
          dailyTotal += Number(item.priceAtPurchase);
        }
      });
      
      return {
        date: format(date, "dd.MM"),
        value: dailyTotal,
      };
    });

    // Income Overview (monthly)
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const monthly = monthDays.map(date => {
      const dateStr = format(date, "yyyy-MM-dd");
      const items = orderItemsByDate.get(dateStr) || [];
      
      let dailyTotal = 0;
      items.forEach((item: OrderItemWithPayment) => {
        if (item.isRefunded) {
          dailyTotal += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
        } else {
          dailyTotal += Number(item.priceAtPurchase);
        }
      });
      
      return {
        date: format(date, "dd.MM"),
        value: dailyTotal,
      };
    });

    // Monthly Report (current week, by day)
    const monthlyReport = weekly.map((d, i) => ({
      day: ["M", "T", "W", "T", "F", "S", "S"][i % 7],
      value: d.value,
    }));

    // Calculate this month and last month sales
    const thisMonthItems = orderItems.filter(item => {
      const date = item.order.payments[0]?.paymentDate || item.createdAt;
      return date >= monthStart && date <= monthEnd;
    });
    
    const lastMonthItems = orderItems.filter(item => {
      const date = item.order.payments[0]?.paymentDate || item.createdAt;
      return date >= lastMonthStart && date <= lastMonthEnd;
    });
    
    let thisMonthSales = 0;
    thisMonthItems.forEach((item: OrderItemWithPayment) => {
      if (item.isRefunded) {
        thisMonthSales += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
      } else {
        thisMonthSales += Number(item.priceAtPurchase);
      }
    });
    
    let lastMonthSales = 0;
    lastMonthItems.forEach((item: OrderItemWithPayment) => {
      if (item.isRefunded) {
        lastMonthSales += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
      } else {
        lastMonthSales += Number(item.priceAtPurchase);
      }
    });

    // Calculate this year and last year sales
    const thisYearItems = orderItems.filter(item => {
      const date = item.order.payments[0]?.paymentDate || item.createdAt;
      return date >= yearStart && date <= yearEnd;
    });
    
    const lastYearItems = orderItems.filter(item => {
      const date = item.order.payments[0]?.paymentDate || item.createdAt;
      return date >= lastYearStart && date <= lastYearEnd;
    });
    
    let thisYearSales = 0;
    thisYearItems.forEach((item: OrderItemWithPayment) => {
      if (item.isRefunded) {
        thisYearSales += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
      } else {
        thisYearSales += Number(item.priceAtPurchase);
      }
    });
    
    let lastYearSales = 0;
    lastYearItems.forEach((item: OrderItemWithPayment) => {
      if (item.isRefunded) {
        lastYearSales += Number(item.priceAtPurchase) - Number(item.refundedAmount || 0);
      } else {
        lastYearSales += Number(item.priceAtPurchase);
      }
    });

    // Analytics Report (simple calculations)
    // Company finance growth: compare this month to last month
    const companyFinanceGrowth = lastMonthSales
      ? ((thisMonthSales - lastMonthSales) / lastMonthSales) * 100
      : 0;
      
    // Company expenses ratio: (simulate as 0.58 for now)
    const companyExpensesRatio = 0.58;
    
    // Business risk cases: count of cancelled/failed orders for this seller
    const failedCount = await db.orderItem.count({
      where: { sellerId, status: { in: ["cancelled"] } },
    });
    
    const businessRiskCases =
      failedCount < 10 ? "Low" : failedCount < 50 ? "Medium" : "High";

    return {
      totalUsers,
      totalOrders,
      totalSales,
      totalRefund,
      totalShippingCharge,
      totalGST,
      incomeOverview: { weekly, monthly },
      monthlyReport: { week: monthlyReport },
      analyticsReport: {
        companyFinanceGrowth: Number(companyFinanceGrowth.toFixed(2)),
        companyExpensesRatio,
        businessRiskCases,
      },
      salesReport: {
        thisYear: thisYearSales,
        lastYear: lastYearSales,
        thisMonth: thisMonthSales,
        lastMonth: lastMonthSales,
      },
    };
  }
}
