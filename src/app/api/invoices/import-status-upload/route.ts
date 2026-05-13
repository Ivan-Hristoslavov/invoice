import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import iconv from "iconv-lite";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { applyInvoiceStatusImport } from "@/lib/services/invoice-status-import";
import {
  detectMicroinvestTxtKind,
  parseMicroinvestTxtFormScriptStatusImport,
  parseMicroinvestTxtKeyValueStatusImport,
  parseMicroinvestXmlStatusImport,
  parseStatusImportCsv,
  parseStatusImportJson,
} from "@/lib/invoice-status-import-parsers";

const formatSchema = z.enum([
  "csv_status",
  "json_status",
  "microinvest_xml",
  "microinvest_txt",
]);

function decodeFileBuffer(buf: Buffer): string {
  const asUtf8 = buf.toString("utf8");
  if (!/\uFFFD/.test(asUtf8)) return asUtf8;
  try {
    return iconv.decode(buf, "cp1251");
  } catch {
    return asUtf8;
  }
}

async function readUploadFileField(raw: FormDataEntryValue | null): Promise<Buffer | null> {
  if (raw == null) return null;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return null;
    return Buffer.from(s, "utf8");
  }
  if (typeof raw === "object" && raw !== null && "arrayBuffer" in raw) {
    const b = raw as Blob;
    if (typeof b.size === "number" && b.size === 0) return null;
    if (typeof (b as Blob).arrayBuffer !== "function") return null;
    const ab = await b.arrayBuffer();
    return Buffer.from(ab);
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Потребителят не е намерен" }, { status: 404 });
    }

    const form = await request.formData();
    const formatRaw = String(form.get("format") ?? "");
    const formatParsed = formatSchema.safeParse(formatRaw);
    if (!formatParsed.success) {
      return NextResponse.json(
        { error: "Невалиден format. Използвайте: csv_status, json_status, microinvest_xml, microinvest_txt." },
        { status: 400 }
      );
    }
    const format = formatParsed.data;

    const defaultCompanyId = String(form.get("defaultCompanyId") ?? "").trim();
    const buf = await readUploadFileField(form.get("file"));
    if (!buf || buf.length === 0) {
      return NextResponse.json({ error: "Липсва или празен файл (поле file)" }, { status: 400 });
    }

    const text = decodeFileBuffer(buf);

    let parseResult;
    let source = `upload:${format}`;

    switch (format) {
      case "csv_status":
        parseResult = parseStatusImportCsv(text);
        break;
      case "json_status":
        parseResult = parseStatusImportJson(text);
        break;
      case "microinvest_xml":
        parseResult = parseMicroinvestXmlStatusImport(text, defaultCompanyId);
        break;
      case "microinvest_txt": {
        const kind = detectMicroinvestTxtKind(text);
        if (kind === "kv") {
          parseResult = parseMicroinvestTxtKeyValueStatusImport(text, defaultCompanyId);
        } else if (kind === "formscript") {
          parseResult = parseMicroinvestTxtFormScriptStatusImport(text, defaultCompanyId);
        } else {
          return NextResponse.json(
            {
              error:
                "Не разпознат Microinvest TXT формат. Очаква се key=value (MICROINVEST_WAREHOUSE_EXPORT_V1) или FormScript (F3 + Наредител).",
            },
            { status: 400 }
          );
        }
        break;
      }
    }

    if (parseResult.rows.length === 0) {
      return NextResponse.json(
        {
          error: "Няма валидни редове за импорт",
          warnings: parseResult.warnings,
        },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const result = await applyInvoiceStatusImport({
      supabase,
      userId: sessionUser.id,
      rows: parseResult.rows,
      source,
      audit: {
        ipAddress: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      },
    });

    return NextResponse.json({
      ...result,
      parseWarnings: parseResult.warnings,
    });
  } catch (error) {
    console.error("Invoice status import upload failed:", error);
    return NextResponse.json({ error: "Неуспешен импорт от файл" }, { status: 500 });
  }
}
