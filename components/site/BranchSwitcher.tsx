"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

export function BranchSwitcher({
  branches,
  value,
  label,
}: {
  branches: { id: string; label: string }[];
  value: string;
  label: string;
}) {
  const router = useRouter();

  return (
    <label className="grid max-w-xs gap-1.5 text-sm font-medium">
      {label}
      <Select
        value={value}
        onChange={(e) => router.push(`/site/menu?branch=${e.target.value}`)}
      >
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.label}
          </option>
        ))}
      </Select>
    </label>
  );
}
