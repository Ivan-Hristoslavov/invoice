import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyBookJson, type CompanyBookResponse } from "@/lib/companybook";
import {
  mapCompanyBookRouteError,
  parseNormalizedIdentifier,
  requireCompanyBookAccess,
} from "@/app/api/companybook/_utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uic: string }> }
) {
  const auth = await requireCompanyBookAccess();
  if ("response" in auth) return auth.response;

  const { uic } = await params;
  const parsed = parseNormalizedIdentifier(uic, "ЕИК/БУЛСТАТ");
  if ("errorResponse" in parsed) return parsed.errorResponse;

  const withData = request.nextUrl.searchParams.get("with_data") === "true";

  try {
    const data = await fetchCompanyBookJson<CompanyBookResponse>(
      `/companies/${parsed.normalized}`,
      { query: { with_data: withData } }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook companies/[uic] error:", error);
    return mapCompanyBookRouteError(error);
  }
}
