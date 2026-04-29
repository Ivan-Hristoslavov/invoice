import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyBookJson } from "@/lib/companybook";
import {
  mapCompanyBookRouteError,
  parseNormalizedIdentifier,
  requireCompanyBookAccess,
} from "@/app/api/companybook/_utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ uic: string }> }
) {
  const auth = await requireCompanyBookAccess();
  if ("response" in auth) return auth.response;

  const { uic } = await params;
  const parsed = parseNormalizedIdentifier(uic, "ЕИК/БУЛСТАТ");
  if ("errorResponse" in parsed) return parsed.errorResponse;

  try {
    const data = await fetchCompanyBookJson(
      `/companies/${parsed.normalized}/financial`
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook companies/[uic]/financial error:", error);
    return mapCompanyBookRouteError(error);
  }
}
