import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { checkSubscriptionLimits } from "@/middleware/subscription";

const DEFAULT_API_BASE = "https://api.companybook.bg/api/companies";
const FETCH_TIMEOUT_MS = 20_000;

function getCompanyBookCredentials(): { apiBase: string; apiKey: string } {
  const apiKey = (
    process.env.COMPANYBOOK_API_KEY ||
    process.env.COMPANY_BOOK_API_KEY ||
    ""
  ).trim();
  const rawBase = (
    process.env.COMPANYBOOK_API_BASE ||
    process.env.COMPANY_BOOK_API_BASE_URL ||
    DEFAULT_API_BASE
  ).trim();
  const apiBase = rawBase || DEFAULT_API_BASE;
  return { apiBase, apiKey };
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uic: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
  }

  const sessionUser = await resolveSessionUser(session.user);
  if (!sessionUser) {
    return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 401 });
  }

  const eikCheck = await checkSubscriptionLimits(sessionUser.id, "eikSearch");
  if (!eikCheck.allowed) {
    return NextResponse.json(
      {
        error: eikCheck.message || "Търсенето по ЕИК е налично в плана Стартер. Надградете за да попълвате данни автоматично от Регистъра.",
        upgradeRequired: true,
        requiredPlan: "STARTER",
      },
      { status: 403 }
    );
  }

  const { uic } = await params;

  if (!uic || !/^\d{9,13}$/.test(uic)) {
    return NextResponse.json(
      { error: "Невалиден ЕИК/БУЛСТАТ. Въведете 9-13 цифри." },
      { status: 400 }
    );
  }

  const { apiBase, apiKey } = getCompanyBookCredentials();

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Автоматичното попълване по ЕИК е временно недостъпно. Можете да продължите с ръчно въвеждане.",
        featureUnavailable: true,
        configMissing: true,
      },
      { status: 503 }
    );
  }

  try {
    const url = `${apiBase.replace(/\/companies\/?$/, "")}/companies/${uic}?with_data=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: `Не е намерена компания с ЕИК ${uic}` },
          { status: 404 }
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

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      return NextResponse.json(
        {
          error: "Невалиден отговор от регистъра. Можете да продължите с ръчно въвеждане.",
          featureUnavailable: true,
        },
        { status: 503 }
      );
    }
    return NextResponse.json(data);
  } catch (error) {
    const isAbort =
      error instanceof Error &&
      (error.name === "AbortError" || error.name === "TimeoutError");
    console.error("CompanyBook API error:", error);
    return NextResponse.json(
      {
        error: isAbort
          ? "Превишено време за отговор от регистъра. Опитайте отново или въведете данните ръчно."
          : "Неуспешна връзка с CompanyBook API. Можете да продължите с ръчно въвеждане.",
        featureUnavailable: true,
      },
      { status: 503 }
    );
  }
}
