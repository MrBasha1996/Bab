"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";

export interface EventReservationRow {
  id: string;
  branchId: string;
  branchName: string;
  reservationType: "event" | "corporate";
  companyName: string | null;
  contactName: string;
  contactPhone: string;
  guestCount: number;
  eventDate: string;
  status: "pending" | "confirmed" | "rejected";
  notes: string | null;
}

export function EventReservationsListTable({ rows }: { rows: EventReservationRow[] }) {
  const t = useTranslations("eventReservations");
  const tc = useTranslations();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [type, setType] = useState("all");
  const [branchId, setBranchId] = useState("all");
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
      if (status !== "all" && r.status !== status) return false;
      if (type !== "all" && r.reservationType !== type) return false;
      if (branchId !== "all" && r.branchId !== branchId) return false;
      const time = new Date(r.eventDate).getTime();
      if (fromTime !== null && time < fromTime) return false;
      if (toTime !== null && time >= toTime) return false;
      if (!q) return true;
      return (r.companyName ?? "").toLowerCase().includes(q) || r.contactName.toLowerCase().includes(q);
    });
  }, [rows, search, status, type, branchId, dateFrom, dateTo]);

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
            <SelectItem value="event">{t("type.event")}</SelectItem>
            <SelectItem value="corporate">{t("type.corporate")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("common.all")}</SelectItem>
            <SelectItem value="pending">{t("status.pending")}</SelectItem>
            <SelectItem value="confirmed">{t("status.confirmed")}</SelectItem>
            <SelectItem value="rejected">{t("status.rejected")}</SelectItem>
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
              <TableHead>{t("form.companyName")}</TableHead>
              <TableHead>{t("form.contactPhone")}</TableHead>
              <TableHead>{t("form.branch")}</TableHead>
              <TableHead>{t("form.reservationType")}</TableHead>
              <TableHead>{t("form.eventDate")}</TableHead>
              <TableHead>{t("form.guestCount")}</TableHead>
              <TableHead>{t("detail.status")}</TableHead>
              <TableHead>{t("form.notes")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.id} className="cursor-pointer">
                <TableCell className="font-medium">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {row.companyName || row.contactName}
                  </Link>
                </TableCell>
                <TableCell dir="ltr" className="text-muted-foreground">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {row.contactPhone}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {row.branchName}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {t(`type.${row.reservationType}`)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {new Date(row.eventDate).toLocaleString()}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {t("guestCountLabel", { count: row.guestCount })}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <Link href={`/event-reservations/${row.id}`} className="block">
                    {t(`status.${row.status}`)}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground max-w-48 truncate">
                  <Link href={`/event-reservations/${row.id}`} className="block">
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
