import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

interface PaginationProps {
  page: number;
  totalPages: number;
  hrefForPage: (page: number) => string;
}

export function Pagination({ page, totalPages, hrefForPage }: PaginationProps) {
  const t = useTranslations("common");
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        asChild
        variant="outline"
        size="sm"
        className={page <= 1 ? "pointer-events-none opacity-50" : ""}
      >
        <Link href={hrefForPage(Math.max(1, page - 1))}>{t("previous")}</Link>
      </Button>
      <span className="text-sm text-muted-foreground">
        {t("pageOf", { page, total: totalPages })}
      </span>
      <Button
        asChild
        variant="outline"
        size="sm"
        className={page >= totalPages ? "pointer-events-none opacity-50" : ""}
      >
        <Link href={hrefForPage(Math.min(totalPages, page + 1))}>{t("next")}</Link>
      </Button>
    </div>
  );
}
