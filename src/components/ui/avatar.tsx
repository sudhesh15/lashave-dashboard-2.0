import * as React from "react";
import { cn } from "@/lib/utils";

type AvatarSize = "xsmall" | "small" | "medium" | "large" | "xlarge" | "xxlarge";

interface AvatarProps {
  src: string;
  alt?: string;
  size?: AvatarSize;
  status?: "online" | "offline" | "busy" | "none";
  className?: string;
}

const sizeClasses: Record<AvatarSize, string> = {
  xsmall: "h-6 w-6 max-w-6",
  small: "h-8 w-8 max-w-8",
  medium: "h-10 w-10 max-w-10",
  large: "h-12 w-12 max-w-12",
  xlarge: "h-14 w-14 max-w-14",
  xxlarge: "h-16 w-16 max-w-16",
};

const statusSizeClasses: Record<AvatarSize, string> = {
  xsmall: "h-1.5 w-1.5 max-w-1.5",
  small: "h-2 w-2 max-w-2",
  medium: "h-2.5 w-2.5 max-w-2.5",
  large: "h-3 w-3 max-w-3",
  xlarge: "h-3.5 w-3.5 max-w-3.5",
  xxlarge: "h-4 w-4 max-w-4",
};

const statusColorClasses = {
  online: "bg-success-500",
  offline: "bg-error-400",
  busy: "bg-warning-500",
};

export function Avatar({
  src,
  alt = "User Avatar",
  size = "medium",
  status = "none",
  className,
}: AvatarProps) {
  return (
    <div className={cn("relative rounded-full", sizeClasses[size], className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- avatar src comes from a
          dynamic, environment-dependent backend host; next/image would require every
          such host allowlisted in next.config.ts */}
      <img src={src} alt={alt} className="h-full w-full rounded-full object-cover" />
      {status !== "none" && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900",
            statusSizeClasses[size],
            statusColorClasses[status]
          )}
        />
      )}
    </div>
  );
}

interface AvatarTextProps {
  name: string;
  className?: string;
}

const AVATAR_TEXT_COLORS = [
  "bg-brand-100 text-brand-600",
  "bg-theme-pink-500/10 text-theme-pink-500",
  "bg-blue-light-100 text-blue-light-600",
  "bg-orange-100 text-orange-600",
  "bg-success-100 text-success-600",
  "bg-theme-purple-500/10 text-theme-purple-500",
  "bg-warning-100 text-warning-600",
  "bg-error-100 text-error-600",
];

export function AvatarText({ name, className = "" }: AvatarTextProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIndex = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colorClass = AVATAR_TEXT_COLORS[colorIndex % AVATAR_TEXT_COLORS.length];

  return (
    <div
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-full",
        colorClass,
        className
      )}
    >
      <span className="text-sm font-medium">{initials}</span>
    </div>
  );
}
