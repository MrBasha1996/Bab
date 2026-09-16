import { cn } from "@/lib/utils";

export function BranchDivider({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 24"
      preserveAspectRatio="none"
      className={cn("h-6 w-full text-border", className)}
      aria-hidden="true"
    >
      <path
        d="M0 12 H70 M70 12 C85 12 85 4 100 4 H160 M70 12 C85 12 85 20 100 20 H160 M160 4 L172 4 M160 20 L172 20 M200 12 H130"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );
}
