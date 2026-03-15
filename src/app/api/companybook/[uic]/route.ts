import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveSessionUser } from "@/lib/session-user";
import { checkSubscriptionLimits } from "@/middleware/subscription";

const API_BASE = process.env.COMPANYBOOK_API_BASE || process.env.COMPANY_BOOK_API_BASE_URL || "https://api.companybook.bg/api/companies";
const API_KEY = process.env.COMPANYBOOK_API_KEY || process.env.COMPANY_BOOK_API_KEY || "";

export async function GET(
  request: NextRequest,
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

  if (!API_KEY) {
    return NextResponse.json(
      {
        error: "Автоматичното попълване по ЕИК е временно недостъпно. Можете да продължите с ръчно въвеждане.",
        featureUnavailable: true,
      },
      { status: 503 }
    );
  }

  try {
    const url = `${API_BASE.replace(/\/companies\/?$/, "")}/companies/${uic}?with_data=true`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        Accept: "application/json",
      },
      next: { revalidate: 3600 },
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

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook API error:", error);
    return NextResponse.json(
      {
        error: "Неуспешна връзка с CompanyBook API. Можете да продължите с ръчно въвеждане.",
        featureUnavailable: true,
      },
      { status: 503 }
    );
  }
}
