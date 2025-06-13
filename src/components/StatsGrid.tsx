import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface StatCard {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease' | 'neutral';
    period: string;
  };
  icon?: React.ReactNode;
  description?: string;
}

interface StatsGridProps {
  stats: StatCard[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  const getTrendIcon = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendColor = (type: 'increase' | 'decrease' | 'neutral') => {
    switch (type) {
      case 'increase':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'decrease':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              {stat.title}
            </CardTitle>
            {stat.icon && (
              <div className="text-gray-400">
                {stat.icon}
              </div>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                {stat.description && (
                  <p className="text-xs text-gray-500 mt-1">
                    {stat.description}
                  </p>
                )}
              </div>
              {stat.change && (
                <Badge 
                  variant="outline" 
                  className={`flex items-center gap-1 ${getTrendColor(stat.change.type)}`}
                >
                  {getTrendIcon(stat.change.type)}
                  <span className="text-xs font-medium">
                    {stat.change.value > 0 ? '+' : ''}{stat.change.value}%
                  </span>
                </Badge>
              )}
            </div>
            {stat.change && (
              <p className="text-xs text-gray-500 mt-2">
                {stat.change.period}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
