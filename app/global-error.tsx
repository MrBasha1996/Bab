"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// يلتقط فشل RootLayout نفسه، لذا لا يمكن الاعتماد على NextIntlClientProvider
// هنا (قد يكون هو سبب الفشل) — نص ثابت بلغتين بدل next-intl.
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "1rem",
            padding: "2rem",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <div dir="rtl">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>حدث خطأ غير متوقّع</h2>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>
              تعذّر تحميل الصفحة. حاول إعادة تحميلها.
            </p>
          </div>
          <div dir="ltr">
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Something went wrong</h2>
            <p style={{ color: "#666", marginTop: "0.5rem" }}>
              The page failed to load. Try reloading it.
            </p>
          </div>
          <button
            onClick={() => retry()}
            style={{
              marginTop: "0.5rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            إعادة المحاولة / Retry
          </button>
        </div>
      </body>
    </html>
  );
}
