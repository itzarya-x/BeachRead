import React from 'react';
import { Table } from '../../../shared/ui/Table';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { Search, Filter, MoreVertical, Shield } from 'lucide-react';

interface UserData {
  id: string;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'user' | 'admin' | 'moderator';
  joinedAt: string;
  lastActive: string;
}

const mockUsers: UserData[] = [
  { id: '1', username: 'shigure', email: 'shigure@beach.read', status: 'active', role: 'admin', joinedAt: '2026-01-15', lastActive: '2 mins ago' },
  { id: '2', username: 'arya', email: 'arya@beach.read', status: 'active', role: 'user', joinedAt: '2026-02-10', lastActive: '1 hour ago' },
  { id: '3', username: 'yura', email: 'yura@beach.read', status: 'active', role: 'moderator', joinedAt: '2026-03-05', lastActive: '12 mins ago' },
  { id: '4', username: 'tsubaki', email: 'tsubaki@beach.read', status: 'inactive', role: 'user', joinedAt: '2026-03-20', lastActive: '2 days ago' },
  { id: '5', username: 'kaito', email: 'kaito@beach.read', status: 'suspended', role: 'user', joinedAt: '2026-04-01', lastActive: '1 week ago' },
];

export default function UserManagement() {
  const columns = [
    { 
      header: 'User', 
      accessor: (user: UserData) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-xs">
            {user.username[0].toUpperCase()}
          </div>
          <div>
            <p className="font-medium">{user.username}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )
    },
    { 
      header: 'Role', 
      accessor: (user: UserData) => (
        <div className="flex items-center gap-1.5">
          {user.role === 'admin' && <Shield className="w-3.5 h-3.5 text-primary" />}
          <span className="capitalize">{user.role}</span>
        </div>
      )
    },
    { 
      header: 'Status', 
      accessor: (user: UserData) => (
        <Badge variant={user.status === 'active' ? 'success' : user.status === 'suspended' ? 'destructive' : 'secondary'}>
          {user.status}
        </Badge>
      )
    },
    { header: 'Joined', accessor: 'joinedAt' as const },
    { header: 'Last Active', accessor: 'lastActive' as const },
    { 
      header: '', 
      accessor: () => (
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-4 h-4" />
        </Button>
      ),
      className: 'text-right'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage user accounts, roles, and permissions.</p>
        </div>
        <Button className="gap-2">
          <Users className="w-4 h-4" />
          Add User
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search users by name, email, or ID..." 
            className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      <Table columns={columns} data={mockUsers} />
    </div>
  );
}

import { Users } from 'lucide-react';
