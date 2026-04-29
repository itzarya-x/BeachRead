import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  RefreshCw, 
  BookOpen, 
  History, 
  Settings,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import { cn } from '../../../shared/utils/cn';

const menuItems = [
  { icon: LayoutDashboard, label: 'Overview', path: '/admin' },
  { icon: Users, label: 'Users', path: '/admin/users' },
  { icon: RefreshCw, label: 'Sync Jobs', path: '/admin/sync' },
  { icon: BookOpen, label: 'Titles', path: '/admin/titles' },
  { icon: History, label: 'Audit Logs', path: '/admin/logs' },
  { icon: Settings, label: 'Settings', path: '/admin/settings' },
];

export function AdminSidebar() {
  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-[calc(100vh-64px)] sticky top-16">
      <div className="p-6">
        <div className="flex items-center gap-2 px-2 mb-8">
          <ShieldCheck className="w-6 h-6 text-primary" />
          <span className="font-bold text-xl tracking-tight">Admin Portal</span>
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5 transition-transform group-hover:scale-110" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 border-t border-border">
        <NavLink
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
          <span>Back to App</span>
        </NavLink>
      </div>
    </aside>
  );
}
