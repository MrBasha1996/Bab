"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

export interface InquiryRow {
  id: string;
  branchId: string;
  branchName: string;
  name: string;
  phone: string;
  subject: string | null;
  status: "new" | "read" | "resolved";
  createdAt: string;
}

export function InquiriesListTable({ rows }: { rows: InquiryRow[] }) {
  const t = useTranslations("inquiries");
  const tc = useTranslations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [branchId, setBranchId] = useState("all");

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.branchId, r.branchName);
    return [...map.entries()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (!q) return true;
      return r.name.toLowerCase().includes(q) || (r.subject ?? "").toLowerCase().includes(q);
    });
  }, [rows, search, status, branchId]);

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
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("common.all")}</SelectItem>
            <SelectItem value="new">{t("status.new")}</SelectItem>
            <SelectItem value="read">{t("status.read")}</SelectItem>
            <SelectItem value="resolved">{t("status.resolved")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{tc("common.noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.name")}</TableHead>
              <TableHead>{t("form.phone")}</TableHead>
              <TableHead>{t("form.branch")}</TableHead>
              <TableHead>{t("form.subject")}</TableHead>
              <TableHead>{t("detail.status")}</TableHead>
              <TableHead>{t("pages.createdAt")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {row.phone}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {row.branchName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-48 truncate">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {row.subject ?? "-"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {t(`status.${row.status}`)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Link href={`/inquiries/${row.id}`} className="block">
                    {new Date(row.createdAt).toLocaleString()}
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
