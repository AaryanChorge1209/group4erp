import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

const colorMap = {
  blue:   { bg: 'bg-blue-100 dark:bg-blue-900/30',   icon: 'text-blue-600 dark:text-blue-400',   text: 'text-blue-700 dark:text-blue-300' },
  green:  { bg: 'bg-green-100 dark:bg-green-900/30', icon: 'text-green-600 dark:text-green-400', text: 'text-green-700 dark:text-green-300' },
  amber:  { bg: 'bg-amber-100 dark:bg-amber-900/30', icon: 'text-amber-600 dark:text-amber-400', text: 'text-amber-700 dark:text-amber-300' },
  red:    { bg: 'bg-red-100 dark:bg-red-900/30',     icon: 'text-red-600 dark:text-red-400',     text: 'text-red-700 dark:text-red-300' },
  purple: { bg: 'bg-purple-100 dark:bg-purple-900/30', icon: 'text-purple-600 dark:text-purple-400', text: 'text-purple-700 dark:text-purple-300' },
  indigo: { bg: 'bg-indigo-100 dark:bg-indigo-900/30', icon: 'text-indigo-600 dark:text-indigo-400', text: 'text-indigo-700 dark:text-indigo-300' },
};

export default function KpiCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', subtitle }) {
  const c = colorMap[color] || colorMap.blue;
  const trendPos = trend > 0;
  const trendNeg = trend < 0;

  return (
    <div className="kpi-card">
      <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0', c.bg)}>
        <Icon className={cn('w-6 h-6', c.icon)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium truncate">{title}</p>
        <p className={cn('text-2xl font-bold mt-0.5', c.text)}>{value ?? '—'}</p>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        {trend !== undefined && trend !== null && (
          <div className={cn('flex items-center gap-1 text-xs font-medium mt-1',
            trendPos ? 'text-green-600 dark:text-green-400' :
            trendNeg ? 'text-red-600 dark:text-red-400' : 'text-gray-500')}>
            {trendPos ? <TrendingUp className="w-3 h-3" /> : trendNeg ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            <span>{trendPos ? '+' : ''}{trend}% {trendLabel || 'vs last month'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
