import { NextRequest, NextResponse } from "next/server";
import {
  fetchCompanyBookJson,
  type CompanyBookSharedSearchResponse,
} from "@/lib/companybook";
import {
  mapCompanyBookRouteError,
  parseLimit,
  parseNameQuery,
  requireCompanyBookAccess,
} from "@/app/api/companybook/_utils";

export async function GET(request: NextRequest) {
  const auth = await requireCompanyBookAccess();
  if ("response" in auth) return auth.response;

  const query = request.nextUrl.searchParams;
  const parsedName = parseNameQuery(query.get("name"), "Заявката за търсене");
  if ("errorResponse" in parsedName) return parsedName.errorResponse;
  const limit = parseLimit(query.get("limit"), 3, 1, 20);

  try {
    const data = await fetchCompanyBookJson<CompanyBookSharedSearchResponse>(
      "/shared/search",
      {
        query: {
          name: parsedName.name,
          limit,
        },
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook shared/search error:", error);
    return mapCompanyBookRouteError(error);
  }
}
