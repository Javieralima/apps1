import { getEstadoColor, getEstadoLabel } from "@/lib/utils";

interface BadgeProps {
  estado: string;
}

export default function Badge({ estado }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(estado)}`}
    >
      {getEstadoLabel(estado)}
    </span>
  );
}
