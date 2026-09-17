import "server-only";

export interface ReceiptOcrResult {
  amount: number | null;
  invoiceNumber: string | null;
  note: string | null;
}

const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// يستخرج من صورة فاتورة: (1) تأكيد أن اسم المطعم على الفاتورة يطابق اسم
// المطعم صاحب الفرع (يُمرَّر ديناميكياً — لا يُكتب اسم مطعم بعينه هنا، النظام
// متعدد المطاعم)، (2) المبلغ الإجمالي، (3) رقم الفاتورة (حقل "فاتورة#" على
// الإيصال، يختلف عن رقم الطلب "الطلب#") — عبر موديل رؤية مجاني على OpenRouter
// (inclusionai/ling-3.0-flash-vl:free، راجع 14.6/14.7 في tasks/todo.md). موديل
// تفكير (reasoning) يستهلك جزءاً من max_tokens قبل الإجابة، لذا الحد أعلى من
// موديل مباشر عادي. عند فشل أي خطوة تُعاد قيم null مع سبب واضح بدل رمي
// استثناء — الاستدعاء (submitLoyaltyReceipt) يسجّل سطراً مرفوضاً بلا نقاط.
export async function extractReceiptAmount(
  imageBytes: Buffer,
  mimeType: string,
  expectedRestaurantNameAr: string,
  expectedRestaurantNameEn: string
): Promise<ReceiptOcrResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return { amount: null, invoiceNumber: null, note: "OPENROUTER_API_KEY غير مُهيَّأ" };
  }

  if (!SUPPORTED_MEDIA_TYPES.includes(mimeType)) {
    return { amount: null, invoiceNumber: null, note: `نوع صورة غير مدعوم: ${mimeType}` };
  }

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "inclusionai/ling-3.0-flash-vl:free",
        max_tokens: 700,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBytes.toString("base64")}` },
              },
              {
                type: "text",
                text:
                  `هذه صورة فاتورة مطعم. اسم المطعم المتوقَّع هو "${expectedRestaurantNameAr}" ` +
                  `(بالإنجليزية: "${expectedRestaurantNameEn}"). ملاحظة: شعار اسم المطعم على الفواتير ` +
                  "غالباً مكتوب بخط عربي كاليغرافي/فني مُزخرف يصعب قراءته حرفياً — اعتبر التطابق ناجحاً طالما " +
                  "الاسم المقروء يماثل الاسم المتوقَّع دلالياً (نفس الكلمات بالمعنى)، حتى لو اختلف الرسم الفني " +
                  "للحروف أو وجد تشابه بصري بين حروف قريبة الشكل (مثل الباء واللام في خط مزخرف). " +
                  "أجب بأربعة أسطر بالضبط، سطر لكل بند، بلا أي نص إضافي قبلها أو بعدها:\n" +
                  "السطر 1: الاسم كما قرأته فعلياً مطبوعاً على الفاتورة (نص عادي، وليس YES/NO)، أو UNKNOWN إن لم يظهر أي اسم مطعم.\n" +
                  "السطر 2: هل هذا الاسم المقروء يطابق دلالياً الاسم المتوقَّع أعلاه (بالمعايير الموضحة فوق)؟ اكتب YES أو NO فقط.\n" +
                  "السطر 3: المبلغ الإجمالي النهائي (Total/المجموع شامل الضريبة) كرقم عشري فقط بلا رمز عملة " +
                  "وبلا فواصل آلاف (مثال: 87.50)، أو UNKNOWN إن تعذّر تحديده بثقة.\n" +
                  'السطر 4: رقم الفاتورة كما هو مكتوب بجانب كلمة "فاتورة#" أو "Invoice" (وليس رقم الطلب ' +
                  '"الطلب#" أو "Order")، أو UNKNOWN إن تعذّرت قراءته بثقة.',
              },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      return { amount: null, invoiceNumber: null, note: `فشل استدعاء خدمة OCR (${response.status})` };
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const rawText = data.choices?.[0]?.message?.content?.trim() ?? "";
    const lines = rawText
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const [readNameLine, restaurantMatchLine, amountLine, invoiceNumberLine] = lines;

    if (!readNameLine || !restaurantMatchLine || !amountLine || !invoiceNumberLine) {
      return { amount: null, invoiceNumber: null, note: "تعذّر على النظام قراءة الفاتورة من الصورة" };
    }

    if (!restaurantMatchLine.toUpperCase().includes("YES")) {
      return {
        amount: null,
        invoiceNumber: null,
        note: `هذه الفاتورة ليست من هذا المطعم (الاسم المقروء: "${readNameLine}")`,
      };
    }

    if (amountLine.toUpperCase().includes("UNKNOWN")) {
      return { amount: null, invoiceNumber: null, note: "تعذّر على النظام قراءة مبلغ الفاتورة من الصورة" };
    }

    const amountMatch = amountLine.match(/\d+(\.\d+)?/);
    const amount = amountMatch ? Number.parseFloat(amountMatch[0]) : NaN;

    if (!Number.isFinite(amount) || amount <= 0) {
      return { amount: null, invoiceNumber: null, note: `قيمة مستخرجة غير صالحة: "${amountLine}"` };
    }

    if (invoiceNumberLine.toUpperCase().includes("UNKNOWN")) {
      return { amount: null, invoiceNumber: null, note: "تعذّر على النظام قراءة رقم الفاتورة من الصورة" };
    }

    const invoiceNumberMatch = invoiceNumberLine.match(/[A-Za-z0-9-]+/);
    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[0] : null;

    if (!invoiceNumber) {
      return { amount: null, invoiceNumber: null, note: `رقم فاتورة مستخرج غير صالح: "${invoiceNumberLine}"` };
    }

    return { amount, invoiceNumber, note: null };
  } catch (err) {
    return {
      amount: null,
      invoiceNumber: null,
      note: err instanceof Error ? err.message : "فشل استدعاء خدمة OCR",
    };
  }
}
