import React from 'react';
import { 
  Users, 
  RefreshCw, 
  BookOpen, 
  AlertCircle,
  TrendingUp,
  Activity,
  History
} from 'lucide-react';
import { YuraCard, YuraSection } from '../../../shared/components/yura';

const stats = [
  { label: 'Total Users', value: '1,284', icon: Users, color: 'text-blue-500', trend: '+12%' },
  { label: 'Sync Jobs (24h)', value: '8,432', icon: RefreshCw, color: 'text-orange-500', trend: '+5%' },
  { label: 'Cached Titles', value: '42,103', icon: BookOpen, color: 'text-green-500', trend: '+2%' },
  { label: 'Active Issues', value: '14', icon: AlertCircle, color: 'text-red-500', trend: '-3%' },
];

export default function AdminOverview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-1">Real-time monitoring and administrative tools.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <YuraCard key={stat.label} className="p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <div className={stat.trend.startsWith('+') ? 'text-green-500 text-xs mt-2 flex items-center' : 'text-red-500 text-xs mt-2 flex items-center'}>
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {stat.trend} from last week
                </div>
              </div>
              <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </YuraCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <YuraSection title="System Health" icon={<Activity className="w-5 h-5" />}>
            <YuraCard className="p-6 h-64 flex items-center justify-center border-dashed">
              <p className="text-muted-foreground italic">System health charts will be rendered here.</p>
            </YuraCard>
          </YuraSection>
        </div>
        
        <div>
          <YuraSection title="Recent Activity" icon={<History className="w-5 h-5" />}>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4 items-start p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium">User 'shigure' updated library</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago • WEB_UI</p>
                  </div>
                </div>
              ))}
            </div>
          </YuraSection>
        </div>
      </div>
    </div>
  );
}

