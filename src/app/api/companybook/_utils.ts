import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { CompanyBookHttpError } from "@/lib/companybook";

type SessionUser = Awaited<ReturnType<typeof resolveSessionUser>>;

export async function requireCompanyBookAccess():
  Promise<{ sessionUser: NonNullable<SessionUser> } | { response: NextResponse }> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { response: NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 }) };
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return { response: NextResponse.json({ error: "Потребителят не е намерен" }, { status: 401 }) };
  }

  const eikCheck = await checkSubscriptionLimits(sessionUser.id, "eikSearch");
  if (!eikCheck.allowed) {
    return {
      response: NextResponse.json(
        {
          error:
            eikCheck.message ||
            "Търсенето по ЕИК е налично в плана Стартер. Надградете за да попълвате данни автоматично от Регистъра.",
          upgradeRequired: true,
          requiredPlan: "STARTER",
        },
        { status: 403 }
      ),
    };
  }

  return { sessionUser };
}

export function parseNormalizedIdentifier(value: string | null, label: string) {
  const normalized = (value || "").replace(/\D/g, "");
  if (!normalized || normalized.length < 9 || normalized.length > 13) {
    return {
      errorResponse: NextResponse.json(
        { error: `Невалиден ${label}. Въведете 9-13 цифри.` },
        { status: 400 }
      ),
    };
  }

  return { normalized };
}

export function parseNameQuery(value: string | null, label: string) {
  const name = (value || "").trim();
  if (name.length < 3) {
    return {
      errorResponse: NextResponse.json(
        { error: `${label} трябва да съдържа поне 3 символа.` },
        { status: 400 }
      ),
    };
  }

  return { name };
}

export function parseLimit(value: string | null, fallback: number, min: number, max: number) {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function mapCompanyBookRouteError(error: unknown) {
  if (error instanceof CompanyBookHttpError) {
    if (error.status === 404) {
      return NextResponse.json({ error: "Няма намерени резултати." }, { status: 404 });
    }

    if (error.status === 401 || error.status === 403) {
      return NextResponse.json(
        { error: "Грешна конфигурация на CompanyBook API ключа.", featureUnavailable: true },
        { status: 503 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: "Дневният лимит към CompanyBook е изчерпан. Опитайте отново утре." },
        { status: 429 }
      );
    }

    if (error.status >= 400 && error.status < 500) {
      return NextResponse.json(
        { error: error.message || "Невалидна заявка към CompanyBook." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: "CompanyBook временно не отговаря. Можете да продължите с ръчно въвеждане.",
        featureUnavailable: true,
      },
      { status: 503 }
    );
  }

  const isAbort =
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError");

  return NextResponse.json(
    {
      error: isAbort
        ? "Превишено време за отговор от регистъра. Опитайте отново."
        : "Неуспешна връзка с CompanyBook API.",
      featureUnavailable: true,
    },
    { status: 503 }
  );
}
