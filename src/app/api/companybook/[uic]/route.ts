import { NextRequest, NextResponse } from "next/server";
import { fetchCompanyBookJson, type CompanyBookResponse } from "@/lib/companybook";
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
  if ("response" in auth) {
    return auth.response;
  }

  const { uic } = await params;
  const parsed = parseNormalizedIdentifier(uic, "ЕИК/БУЛСТАТ");
  if ("errorResponse" in parsed) {
    return parsed.errorResponse;
  }

  try {
    const data = await fetchCompanyBookJson<CompanyBookResponse>(
      `/companies/${parsed.normalized}`,
      {
        query: { with_data: true },
        timeoutMs: 20_000,
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook API error:", error);
    return mapCompanyBookRouteError(error);
  }
}
