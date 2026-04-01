import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Network, MemoryStick } from 'lucide-react';
import type { Observation } from '../types/sre';

interface TelemetryGridProps {
  observation: Observation | null;
  history: Array<{ turn: number; observation: Observation | null }>;
}

interface MetricConfig {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  extractValue: (obs: Observation) => number;
}

const METRICS: MetricConfig[] = [
  {
    key: 'cpu',
    label: 'CPU Usage',
    icon: Cpu,
    color: '#38bdf8',
    extractValue: (obs) => parseFloat(obs.system_metrics.cpu ?? '0'),
  },
  {
    key: 'memory',
    label: 'Memory',
    icon: MemoryStick,
    color: '#a855f7',
    extractValue: (obs) => parseFloat(obs.system_metrics.memory ?? '0'),
  },
  {
    key: 'error_rate',
    label: 'Error Rate',
    icon: HardDrive,
    color: '#ef4444',
    extractValue: (obs) => parseFloat(obs.system_metrics.error_rate ?? '0'),
  },
  {
    key: 'network',
    label: 'Network Traffic',
    icon: Network,
    color: '#22c55e',
    extractValue: (obs) => {
      const raw = obs.system_metrics.network_traffic
        ?? obs.system_metrics.traffic_volume
        ?? '0';
      return parseFloat(raw);
    },
  },
];

function parseMetricValue(obs: Observation, metric: MetricConfig): number {
  try {
    return metric.extractValue(obs);
  } catch {
    return 0;
  }
}

export function TelemetryGrid({ observation, history }: TelemetryGridProps) {
  const chartData = useMemo(() => {
    const points: Array<Record<string, number | string>> = [];

    for (const entry of history) {
      if (!entry.observation) continue;
      const point: Record<string, number | string> = { turn: `T${entry.turn}` };
      for (const m of METRICS) {
        point[m.key] = parseMetricValue(entry.observation, m);
      }
      points.push(point);
    }

    // Include current observation if not yet in history
    if (observation && (points.length === 0 || points[points.length - 1].turn !== `T${observation.turn_number}`)) {
      const point: Record<string, number | string> = { turn: `T${observation.turn_number}` };
      for (const m of METRICS) {
        point[m.key] = parseMetricValue(observation, m);
      }
      points.push(point);
    }

    return points;
  }, [history, observation]);

  return (
    <div className="grid grid-cols-2 gap-3 p-4">
      {METRICS.map((metric, i) => {
        const Icon = metric.icon;
        const current = observation ? parseMetricValue(observation, metric) : 0;

        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="rounded-lg border border-sre-border bg-sre-surface-alt/50 p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
                <span className="text-xs font-mono text-sre-text-muted">{metric.label}</span>
              </div>
              <span className="text-sm font-mono font-semibold" style={{ color: metric.color }}>
                {current.toFixed(0)}%
              </span>
            </div>
            <div className="h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="turn" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1e293b',
                      borderRadius: 6,
                      fontSize: 11,
                    }}
                    labelStyle={{ color: '#94a3b8' }}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric.key}
                    stroke={metric.color}
                    strokeWidth={2}
                    dot={{ r: 3, fill: metric.color }}
                    animationDuration={600}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
