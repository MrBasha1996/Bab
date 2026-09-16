"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface BranchRow {
  id: string;
  nameAr: string;
  nameEn: string | null;
  addressAr: string | null;
  timezone: string;
  createdAt: string;
}

export function BranchesListTable({ rows }: { rows: BranchRow[] }) {
  const t = useTranslations();
  const [search, setSearch] = useState("");

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => r.nameAr.toLowerCase().includes(q) || (r.nameEn ?? "").toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="grid gap-3">
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t("common.searchPlaceholder")}
        className="max-w-xs"
      />

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("common.noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("branches.form.nameAr")}</TableHead>
              <TableHead>{t("branches.form.nameEn")}</TableHead>
              <TableHead>{t("branches.form.addressAr")}</TableHead>
              <TableHead>{t("branches.form.timezone")}</TableHead>
              <TableHead>{t("common.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/branches/${row.id}`} className="block">
                    {row.nameAr}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/branches/${row.id}`} className="block">
                    {row.nameEn}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/branches/${row.id}`} className="block">
                    {row.addressAr ?? "-"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground" dir="ltr">
                  <Link href={`/branches/${row.id}`} className="block">
                    {row.timezone}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Link href={`/branches/${row.id}`} className="block">
                    {new Date(row.createdAt).toLocaleDateString()}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
