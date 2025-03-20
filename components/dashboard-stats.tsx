import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"

interface DashboardStatsProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  trend: string
  trendValue: "positive" | "negative" | "neutral"
}

export function DashboardStats({ title, value, description, icon: Icon, trend, trendValue }: DashboardStatsProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        <div
          className={`mt-2 text-xs ${
            trendValue === "positive"
              ? "text-green-500"
              : trendValue === "negative"
                ? "text-red-500"
                : "text-muted-foreground"
          }`}
        >
          {trend}
        </div>
      </CardContent>
    </Card>
  )
}

