"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

export interface MenuRow {
  id: string;
  branchId: string;
  branchName: string;
  nameAr: string;
  categoriesCount: number;
  createdAt: string;
}

export function MenusListTable({ rows }: { rows: MenuRow[] }) {
  const t = useTranslations();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("all");

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.branchId, r.branchName);
    return [...map.entries()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (!q) return true;
      return r.nameAr.toLowerCase().includes(q);
    });
  }, [rows, search, branchId]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.searchPlaceholder")}
          className="max-w-xs"
        />
        {branchOptions.length > 1 && (
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {branchOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{t("common.noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("menus.form.nameAr")}</TableHead>
              <TableHead>{t("menus.form.branch")}</TableHead>
              <TableHead>{t("menus.pages.categoriesTitle")}</TableHead>
              <TableHead>{t("common.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/menus/${row.id}`} className="block">
                    {row.nameAr}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/menus/${row.id}`} className="block">
                    {row.branchName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/menus/${row.id}`} className="block">
                    {row.categoriesCount}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Link href={`/menus/${row.id}`} className="block">
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
