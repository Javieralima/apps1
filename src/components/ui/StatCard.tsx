interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: number;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
      {(subtitle || trend !== undefined) && (
        <div className="mt-2 flex items-center gap-2">
          {trend !== undefined && (
            <span
              className={`text-xs font-medium ${trend >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {trend >= 0 ? "+" : ""}
              {trend}
            </span>
          )}
          {subtitle && (
            <span className="text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      )}
    </div>
  );
}
