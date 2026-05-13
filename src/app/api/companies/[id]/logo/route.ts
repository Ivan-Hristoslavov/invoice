import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { STORAGE_BUCKET_IMAGES } from "@/config/constants";

function getStoragePath(value: string, bucket: string): string | null {
  if (!value) return null;
  if (!value.startsWith("http://") && !value.startsWith("https://")) return value;
  try {
    const u = new URL(value);
    const marker = `/storage/v1/object/public/${bucket}/`;
    const index = u.pathname.indexOf(marker);
    return index >= 0 ? u.pathname.slice(index + marker.length) : null;
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    const { id: companyId } = await context.params;
    const supabase = createAdminClient();

    // Check if company exists and belongs to user
    const { data: company, error: companyError } = await supabase
      .from("Company")
      .select("id, logo")
      .eq("id", companyId)
      .eq("userId", session.user.id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: "Компанията не е намерена" },
        { status: 404 }
      );
    }

    // Delete logo from storage if exists
    if (company.logo) {
      try {
        const filePath = getStoragePath(company.logo, STORAGE_BUCKET_IMAGES);
        if (filePath) {
          const { error: deleteError } = await supabase.storage
            .from(STORAGE_BUCKET_IMAGES)
            .remove([filePath]);
          if (deleteError) {
            console.warn('Неуспешно изтриване на логото от хранилището:', deleteError);
          }
        }
      } catch (error) {
        console.warn('Грешка при обработка на URL за логото:', error);
      }
    }

    // Update company to remove logo URL
    const { error: updateError } = await supabase
      .from("Company")
      .update({ logo: null })
      .eq("id", companyId)
      .eq("userId", session.user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Неуспешно изтриване на лого" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Грешка при изтриване на лого:", error);
    return NextResponse.json(
      { error: "Вътрешна сървърна грешка" },
      { status: 500 }
    );
  }
}
