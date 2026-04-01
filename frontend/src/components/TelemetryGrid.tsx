import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Cpu, HardDrive, MemoryStick, Network } from 'lucide-react';
import type { ComponentType } from 'react';
import type { Observation, TelemetryPoint } from '../types';

interface TelemetryGridProps {
  telemetry: TelemetryPoint[];
  observation: Observation | null;
}

interface MetricCardConfig {
  key: keyof Pick<TelemetryPoint, 'cpu' | 'memory' | 'network' | 'disk'>;
  title: string;
  tone: string;
  Icon: ComponentType<{ className?: string }>;
}

const METRICS: MetricCardConfig[] = [
  { key: 'cpu', title: 'CPU', tone: '#22d3ee', Icon: Cpu },
  { key: 'memory', title: 'Memory', tone: '#a78bfa', Icon: MemoryStick },
  { key: 'network', title: 'Network', tone: '#34d399', Icon: Network },
  { key: 'disk', title: 'Disk I/O', tone: '#f97316', Icon: HardDrive },
];

export function TelemetryGrid({ telemetry, observation }: TelemetryGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 2xl:grid-cols-2">
      {METRICS.map(({ key, title, tone, Icon }) => {
        const latest = observation ? Math.round(telemetry[telemetry.length - 1]?.[key] ?? 0) : 0;

        return (
          <div key={key} className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 shadow-lg shadow-slate-950/30">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="font-mono text-xs uppercase tracking-wider text-slate-400">{title}</span>
              </div>
              <span className="font-mono text-xs" style={{ color: tone }}>
                {latest}%
              </span>
            </div>
            <div className="h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={telemetry} margin={{ top: 4, right: 2, left: -22, bottom: 0 }}>
                  <defs>
                    <linearGradient id={`fill-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={tone} stopOpacity={0.5} />
                      <stop offset="95%" stopColor={tone} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="turn"
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1e293b',
                      borderRadius: 10,
                      color: '#cbd5e1',
                      fontSize: 12,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Area type="monotone" dataKey={key} stroke={tone} fill={`url(#fill-${key})`} strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
