import React from 'react';
import { Table } from '../../../shared/ui/Table';
import { Badge } from '../../../shared/ui/Badge';
import { Button } from '../../../shared/ui/Button';
import { RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, ExternalLink } from 'lucide-react';

interface SyncJob {
  id: string;
  user: string;
  provider: 'ANILIST' | 'MAL';
  type: 'FULL' | 'INCREMENTAL';
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REQUIRES_RESOLUTION';
  startedAt: string;
  duration: string;
}

const mockJobs: SyncJob[] = [
  { id: 'job-1', user: 'shigure', provider: 'ANILIST', type: 'INCREMENTAL', status: 'COMPLETED', startedAt: '2026-04-23 14:20', duration: '1.2s' },
  { id: 'job-2', user: 'arya', provider: 'ANILIST', type: 'FULL', status: 'PROCESSING', startedAt: '2026-04-23 14:21', duration: '45s...' },
  { id: 'job-3', user: 'yura', provider: 'MAL', type: 'INCREMENTAL', status: 'FAILED', startedAt: '2026-04-23 14:15', duration: '0.5s' },
  { id: 'job-4', user: 'tsubaki', provider: 'ANILIST', type: 'INCREMENTAL', status: 'QUEUED', startedAt: '2026-04-23 14:22', duration: '-' },
  { id: 'job-5', user: 'kaito', provider: 'ANILIST', type: 'INCREMENTAL', status: 'REQUIRES_RESOLUTION', startedAt: '2026-04-23 13:50', duration: '2.1s' },
];

export default function SyncMonitor() {
  const getStatusIcon = (status: SyncJob['status']) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PROCESSING': return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'QUEUED': return <Clock className="w-4 h-4 text-muted-foreground" />;
      case 'REQUIRES_RESOLUTION': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    }
  };

  const columns = [
    { header: 'Job ID', accessor: (job: SyncJob) => <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{job.id}</code> },
    { header: 'User', accessor: 'user' as const },
    { 
      header: 'Provider', 
      accessor: (job: SyncJob) => (
        <Badge variant="secondary" className="gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${job.provider === 'ANILIST' ? 'bg-blue-400' : 'bg-blue-600'}`} />
          {job.provider}
        </Badge>
      )
    },
    { header: 'Type', accessor: 'type' as const },
    { 
      header: 'Status', 
      accessor: (job: SyncJob) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(job.status)}
          <span className="text-sm font-medium">{job.status.replace('_', ' ')}</span>
        </div>
      )
    },
    { header: 'Started At', accessor: 'startedAt' as const },
    { header: 'Duration', accessor: 'duration' as const },
    { 
      header: '', 
      accessor: () => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm">Retry</Button>
          <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sync Monitor</h1>
          <p className="text-muted-foreground mt-1">Monitor background synchronization jobs and resolve conflicts.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            Clear Queue
          </Button>
          <Button className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Success Rate (24h)</p>
          <h3 className="text-3xl font-bold mt-2 text-green-500">98.4%</h3>
          <div className="w-full bg-muted h-2 rounded-full mt-4 overflow-hidden">
            <div className="bg-green-500 h-full w-[98.4%]" />
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Avg. Duration</p>
          <h3 className="text-3xl font-bold mt-2">1.4s</h3>
          <p className="text-xs text-muted-foreground mt-2">-0.2s from yesterday</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground font-medium">Failed Jobs</p>
          <h3 className="text-3xl font-bold mt-2 text-red-500">12</h3>
          <p className="text-xs text-muted-foreground mt-2">Requires manual review</p>
        </div>
      </div>

      <Table columns={columns} data={mockJobs} />
    </div>
  );
}
