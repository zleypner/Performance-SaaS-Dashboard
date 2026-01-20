import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Users, DollarSign, UserCheck, UserMinus } from "lucide-react";
import { formatCurrency, formatNumber, formatPercentage } from "@/lib/utils";

interface KPIData {
  revenue: number;
  revenueChange: number;
  activeUsers: number;
  activeUsersChange: number;
  conversionRate: number;
  conversionChange: number;
  churnRate: number;
  churnChange: number;
}

interface KPICardsProps {
  data: KPIData;
}

export function KPICards({ data }: KPICardsProps) {
  const cards = [
    {
      title: "Total Revenue",
      value: formatCurrency(data.revenue),
      change: data.revenueChange,
      icon: DollarSign,
    },
    {
      title: "Active Users",
      value: formatNumber(data.activeUsers),
      change: data.activeUsersChange,
      icon: Users,
    },
    {
      title: "Conversion Rate",
      value: formatPercentage(data.conversionRate),
      change: data.conversionChange,
      icon: UserCheck,
    },
    {
      title: "Churn Rate",
      value: formatPercentage(data.churnRate),
      change: data.churnChange,
      icon: UserMinus,
      invertColors: true, // Lower churn is better
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const isPositive = card.invertColors ? card.change < 0 : card.change > 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;

        return (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center pt-1">
                <TrendIcon
                  className={`h-4 w-4 ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className={`ml-1 text-xs ${
                    isPositive ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {card.change > 0 ? "+" : ""}
                  {card.change.toFixed(1)}%
                </span>
                <span className="ml-1 text-xs text-muted-foreground">
                  vs last period
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
