import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyBookJson } from "@/lib/companybook";
import {
  mapCompanyBookRouteError,
  requireCompanyBookAccess,
} from "@/app/api/companybook/_utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ indent: string }> }
) {
  const auth = await requireCompanyBookAccess();
  if ("response" in auth) return auth.response;

  const { indent } = await params;
  const normalizedIndent = (indent || "").trim();
  if (normalizedIndent.length < 5) {
    return NextResponse.json(
      { error: "Невалиден идентификатор на лице." },
      { status: 400 }
    );
  }

  const withData = request.nextUrl.searchParams.get("with_data") === "true";

  try {
    const data = await fetchCompanyBookJson(`/people/${normalizedIndent}`, {
      query: { with_data: withData },
    });
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook people/[indent] error:", error);
    return mapCompanyBookRouteError(error);
  }
}
