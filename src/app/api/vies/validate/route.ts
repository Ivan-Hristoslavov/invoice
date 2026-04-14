import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import {
  buildViesAutofillAndPersistence,
  fetchViesCheckVatNumber,
  parseEuVatInput,
} from "@/lib/vies";
import { z } from "zod";

const bodySchema = z.object({
  vatInput: z.string().min(4, "Въведете пълен ДДС номер (напр. BG123456789)"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 401 });
    }

    const gate = await checkSubscriptionLimits(sessionUser.id, "eikSearch");
    if (!gate.allowed) {
      return NextResponse.json(
        {
          error:
            gate.message ||
            "Проверката в VIES е налична от план Стартер (като търсенето по ЕИК).",
          upgradeRequired: true,
          requiredPlan: "STARTER",
        },
        { status: 403 }
      );
    }

    const json = await request.json();
    const { vatInput } = bodySchema.parse(json);
    const parsed = parseEuVatInput(vatInput);
    if (!parsed) {
      return NextResponse.json(
        {
          error: "Невалиден формат. Въведете ДДС номер с префикс на държавата (напр. BG831826092, DE123...).",
          errorCode: "PARSE_ERROR" as const,
        },
        { status: 400 }
      );
    }

    let api;
    try {
      api = await fetchViesCheckVatNumber(parsed.countryCode, parsed.vatLocal);
    } catch (err) {
      const isAbort =
        err instanceof Error && (err.name === "AbortError" || err.name === "TimeoutError");
      return NextResponse.json(
        {
          error: isAbort
            ? "Превишено време за отговор от VIES. Опитайте отново."
            : "Услугата VIES временно не отговаря. Опитайте по-късно.",
          errorCode: "SERVICE_ERROR" as const,
        },
        { status: 503 }
      );
    }

    if (api.userError && api.valid !== true && api.valid !== false) {
      return NextResponse.json(
        {
          error: "Неуспешна проверка в VIES. Опитайте отново или въведете данните ръчно.",
          errorCode: "SERVICE_ERROR" as const,
        },
        { status: 503 }
      );
    }

    const result = buildViesAutofillAndPersistence(parsed, api);

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || "Невалидни данни" },
        { status: 400 }
      );
    }
    console.error("VIES validate error:", error);
    return NextResponse.json({ error: "Вътрешна грешка при VIES" }, { status: 500 });
  }
}
