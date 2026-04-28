import { NextRequest, NextResponse } from "next/server";
import {
  fetchCompanyBookJson,
  type CompanyBookPeopleSearchResponse,
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
  const parsedName = parseNameQuery(query.get("name"), "Името за търсене");
  if ("errorResponse" in parsedName) return parsedName.errorResponse;

  const withData = query.get("with_data") === "true";
  const limit = parseLimit(query.get("limit"), 20, 1, 50);

  try {
    const data = await fetchCompanyBookJson<CompanyBookPeopleSearchResponse>(
      "/people/search",
      {
        query: {
          name: parsedName.name,
          with_data: withData,
          limit,
        },
      }
    );
    return NextResponse.json(data);
  } catch (error) {
    console.error("CompanyBook people/search error:", error);
    return mapCompanyBookRouteError(error);
  }
}
