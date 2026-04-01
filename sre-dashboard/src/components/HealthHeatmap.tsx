import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import type { Observation } from '../types/sre';

interface HealthHeatmapProps {
  observation: Observation | null;
}

interface ServiceNode {
  id: string;
  label: string;
  getStatus: (obs: Observation) => 'healthy' | 'degraded' | 'critical';
}

const SERVICES: ServiceNode[] = [
  {
    id: 'auth',
    label: 'Auth',
    getStatus: (obs) => {
      const alerts = obs.active_alerts.join(' ').toLowerCase();
      if (alerts.includes('auth') || alerts.includes('timeout')) return 'critical';
      if (obs.system_health < 40) return 'degraded';
      return 'healthy';
    },
  },
  {
    id: 'checkout',
    label: 'Checkout',
    getStatus: (obs) => {
      const errorRate = parseFloat(obs.system_metrics.error_rate ?? '0');
      if (errorRate > 20) return 'critical';
      if (errorRate > 5) return 'degraded';
      return 'healthy';
    },
  },
  {
    id: 'database',
    label: 'Database',
    getStatus: (obs) => {
      const alerts = obs.active_alerts.join(' ').toLowerCase();
      const results = Object.values(obs.investigation_results).join(' ').toLowerCase();
      if (alerts.includes('database') || alerts.includes('deadlock') || results.includes('lock')) return 'critical';
      if (obs.system_health < 50) return 'degraded';
      return 'healthy';
    },
  },
  {
    id: 'cache',
    label: 'Cache',
    getStatus: (obs) => {
      if (obs.system_health < 30) return 'critical';
      if (obs.system_health < 60) return 'degraded';
      return 'healthy';
    },
  },
  {
    id: 'api-gw',
    label: 'API Gateway',
    getStatus: (obs) => {
      const alerts = obs.active_alerts.join(' ').toLowerCase();
      if (alerts.includes('502') || alerts.includes('gateway')) return 'critical';
      if (obs.system_health < 50) return 'degraded';
      return 'healthy';
    },
  },
  {
    id: 'cdn',
    label: 'CDN',
    getStatus: (obs) => {
      const alerts = obs.active_alerts.join(' ').toLowerCase();
      if (alerts.includes('traffic') && obs.system_health < 40) return 'critical';
      if (alerts.includes('traffic')) return 'degraded';
      return 'healthy';
    },
  },
];

const STATUS_CONFIG = {
  healthy: {
    bg: 'bg-sre-green-dim',
    border: 'border-sre-green/30',
    text: 'text-sre-green',
    icon: CheckCircle,
    pulse: false,
  },
  degraded: {
    bg: 'bg-sre-yellow-dim',
    border: 'border-sre-yellow/30',
    text: 'text-sre-yellow',
    icon: AlertTriangle,
    pulse: false,
  },
  critical: {
    bg: 'bg-sre-red-dim',
    border: 'border-sre-red/30',
    text: 'text-sre-red',
    icon: AlertCircle,
    pulse: true,
  },
};

export function HealthHeatmap({ observation }: HealthHeatmapProps) {
  return (
    <div className="p-4">
      <div className="text-[10px] font-mono text-sre-text-muted tracking-wider uppercase mb-3">
        SERVICE HEALTH MAP
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SERVICES.map((svc) => {
          const status = observation ? svc.getStatus(observation) : 'healthy';
          const config = STATUS_CONFIG[status];
          const Icon = config.icon;

          return (
            <motion.div
              key={svc.id}
              animate={config.pulse ? { opacity: [1, 0.6, 1] } : { opacity: 1 }}
              transition={config.pulse ? { duration: 1.5, repeat: Infinity } : {}}
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-lg border ${config.bg} ${config.border}`}
            >
              <Icon className={`w-4 h-4 ${config.text}`} />
              <span className={`text-[10px] font-mono ${config.text}`}>
                {svc.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
