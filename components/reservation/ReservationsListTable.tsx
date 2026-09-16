"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

export interface ReservationRow {
  id: string;
  branchId: string;
  branchName: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationTime: string;
  tableLabel: string | null;
  source: "website" | "phone" | "walk_in";
  status: "pending" | "confirmed" | "cancelled";
  notes: string | null;
}

const STATUS_KEY: Record<ReservationRow["status"], string> = {
  pending: "detail.statusPending",
  confirmed: "detail.statusConfirmed",
  cancelled: "detail.statusCancelled",
};

export function ReservationsListTable({ rows }: { rows: ReservationRow[] }) {
  const t = useTranslations("reservations");
  const tc = useTranslations();
  const [search, setSearch] = useState("");
  const [branchId, setBranchId] = useState("all");
  const [status, setStatus] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const branchOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of rows) map.set(r.branchId, r.branchName);
    return [...map.entries()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTime = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTime = dateTo ? new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 : null;
    return rows.filter((r) => {
      if (branchId !== "all" && r.branchId !== branchId) return false;
      if (status !== "all" && r.status !== status) return false;
      const time = new Date(r.reservationTime).getTime();
      if (fromTime !== null && time < fromTime) return false;
      if (toTime !== null && time >= toTime) return false;
      if (!q) return true;
      return r.customerName.toLowerCase().includes(q) || r.customerPhone.toLowerCase().includes(q);
    });
  }, [rows, search, branchId, status, dateFrom, dateTo]);

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
            <SelectItem value="pending">{t("detail.statusPending")}</SelectItem>
            <SelectItem value="confirmed">{t("detail.statusConfirmed")}</SelectItem>
            <SelectItem value="cancelled">{t("detail.statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{tc("common.from")}</span>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <span>{tc("common.to")}</span>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
        </div>
      </div>

      {filteredRows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{tc("common.noResults")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("form.customerName")}</TableHead>
              <TableHead>{t("form.customerPhone")}</TableHead>
              <TableHead>{t("form.branch")}</TableHead>
              <TableHead>{t("form.reservationTime")}</TableHead>
              <TableHead>{t("form.table")}</TableHead>
              <TableHead>{t("form.source")}</TableHead>
              <TableHead>{t("detail.status")}</TableHead>
              <TableHead>{t("form.notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {row.customerName}
                  </Link>
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {row.customerPhone}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {row.branchName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {new Date(row.reservationTime).toLocaleString()}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {row.tableLabel ?? "-"}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {t(`detail.sourceValue.${row.source}`)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {t(STATUS_KEY[row.status])}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-48 truncate">
                  <Link href={`/reservations/${row.id}`} className="block">
                    {row.notes ?? "-"}
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
