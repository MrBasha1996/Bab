import { getTranslations } from "next-intl/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface SubmissionRow {
  id: string;
  memberPhone: string;
  branchNameAr: string;
  branchNameEn: string;
  extractedAmount: number | null;
  invoiceNumber: string | null;
  pointsAwarded: number;
  status: "pending_ocr" | "approved" | "rejected";
  createdAt: string;
}

// سجل توثيقي للتدقيق فقط (server component، بلا تفاعل) — بلا تعديل يدوي
// على النقاط في هذا النطاق الأولي (راجع المرحلة 14 في tasks/todo.md).
export async function SubmissionsTable({ rows }: { rows: SubmissionRow[] }) {
  const t = await getTranslations("loyalty.submissions");

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("member")}</TableHead>
          <TableHead>{t("branch")}</TableHead>
          <TableHead>{t("amount")}</TableHead>
          <TableHead>{t("invoiceNumber")}</TableHead>
          <TableHead>{t("pointsAwarded")}</TableHead>
          <TableHead>{t("statusLabel")}</TableHead>
          <TableHead>{t("createdAt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell dir="ltr" className="text-end">
              {row.memberPhone}
            </TableCell>
            <TableCell>
              {row.branchNameAr} / {row.branchNameEn}
            </TableCell>
            <TableCell>{row.extractedAmount ?? "—"}</TableCell>
            <TableCell dir="ltr" className="text-end">
              {row.invoiceNumber ?? "—"}
            </TableCell>
            <TableCell>{row.pointsAwarded}</TableCell>
            <TableCell>{t(`status.${row.status}`)}</TableCell>
            <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
