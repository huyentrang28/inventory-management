import React from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "purple"
  | "indigo";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  size?: "sm" | "md" | "lg";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  className = "",
  dot = false,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-[10px]",
    md: "px-2 py-0.5 text-xs",
    lg: "px-2.5 py-0.5 text-xs",
  };
  const variantClasses: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
    success: {
      bg: "bg-emerald-50 border-emerald-200/60",
      text: "text-emerald-700",
      dot: "bg-emerald-500",
    },
    warning: {
      bg: "bg-amber-50 border-amber-200/60",
      text: "text-amber-700",
      dot: "bg-amber-500",
    },
    danger: {
      bg: "bg-rose-50 border-rose-200/60",
      text: "text-rose-700",
      dot: "bg-rose-500",
    },
    info: {
      bg: "bg-sky-50 border-sky-200/60",
      text: "text-sky-700",
      dot: "bg-sky-500",
    },
    purple: {
      bg: "bg-purple-50 border-purple-200/60",
      text: "text-purple-700",
      dot: "bg-purple-500",
    },
    indigo: {
      bg: "bg-indigo-50 border-indigo-200/60",
      text: "text-indigo-700",
      dot: "bg-indigo-500",
    },
    neutral: {
      bg: "bg-slate-100 border-slate-200",
      text: "text-slate-700",
      dot: "bg-slate-400",
    },
  };

  const style = variantClasses[variant] || variantClasses.neutral;

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${sizeClasses[size]} rounded-full font-medium border ${style.bg} ${style.text} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case "COMPLETED":
    case "RECEIVED":
    case "ACTIVE":
      return <Badge variant="success" dot>Hoàn tất</Badge>;
    case "APPROVED":
      return <Badge variant="success" dot>Đã duyệt</Badge>;
    case "PENDING_APPROVAL":
      return <Badge variant="warning" dot>Chờ duyệt</Badge>;
    case "IN_PROGRESS":
      return <Badge variant="warning" dot>Đang thực hiện</Badge>;
    case "IN_TRANSIT":
      return <Badge variant="purple" dot>Đang vận chuyển</Badge>;
    case "DRAFT":
      return <Badge variant="neutral" dot>Bản nháp</Badge>;
    case "CANCELLED":
      return <Badge variant="danger" dot>Đã hủy</Badge>;
    case "REJECTED":
      return <Badge variant="danger" dot>Từ chối</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
