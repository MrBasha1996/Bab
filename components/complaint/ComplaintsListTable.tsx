"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

export interface ComplaintRow {
  id: string;
  branchId: string;
  branchName: string;
  tableLabel: string | null;
  type: "complaint" | "suggestion";
  message: string;
  customerName: string | null;
  customerPhone: string | null;
  createdAt: string;
}

export function ComplaintsListTable({ rows }: { rows: ComplaintRow[] }) {
  const t = useTranslations("complaints");
  const tc = useTranslations();
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [branchId, setBranchId] = useState("all");

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.branchId, r.branchName);
    return [...map.entries()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (type !== "all" && r.type !== type) return false;
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (!q) return true;
      return r.message.toLowerCase().includes(q) || (r.customerName ?? "").toLowerCase().includes(q);
    });
  }, [rows, search, type, branchId]);

  return (
    <div className="grid gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={tc("common.searchPlaceholder")}
          className="max-w-xs"
        />
        {branchOptions.length > 1 && (
          <Select value={branchId} onValueChange={setBranchId}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tc("common.all")}</SelectItem>
              {branchOptions.map(([id, name]) => (
                <SelectItem key={id} value={id}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("common.all")}</SelectItem>
            <SelectItem value="complaint">{t("type.complaint")}</SelectItem>
            <SelectItem value="suggestion">{t("type.suggestion")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{tc("common.noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.type")}</TableHead>
              <TableHead>{t("form.message")}</TableHead>
              <TableHead>{t("form.name")}</TableHead>
              <TableHead>{t("form.phone")}</TableHead>
              <TableHead>{t("form.branch")}</TableHead>
              <TableHead>{t("form.table")}</TableHead>
              <TableHead>{t("pages.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{t(`type.${row.type}`)}</TableCell>
                <TableCell className="text-muted-foreground max-w-72 truncate">{row.message}</TableCell>
                <TableCell className="text-muted-foreground">{row.customerName ?? "-"}</TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  {row.customerPhone ?? "-"}
                </TableCell>
                <TableCell className="text-muted-foreground">{row.branchName}</TableCell>
                <TableCell className="text-muted-foreground">{row.tableLabel ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {new Date(row.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
