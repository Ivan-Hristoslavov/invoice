import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    // Check subscription limit for custom branding
    const limitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'customBranding'
    );

    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: limitCheck.message || "Недостатъчен план. Качването на лого е достъпно само за Pro и Business планове." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('logo') as File;
    const companyId = formData.get('companyId') as string;

    if (!file) {
      return NextResponse.json(
        { error: "Не е предоставен файл" },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "Липсва ID на компания" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: "Невалиден тип файл. Позволени са само изображения." },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Размерът на файла надвишава 5MB" },
        { status: 400 }
      );
    }

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

    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${companyId}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase storage bucket "images"
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Грешка при качване в Supabase storage:', uploadError);
      return NextResponse.json(
        { error: "Неуспешно качване на файла в хранилището" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Delete old logo if exists
    if (company.logo) {
      try {
        // Extract file path from old logo URL
        const oldUrl = new URL(company.logo);
        const oldPath = oldUrl.pathname.split('/').slice(-2).join('/'); // Get 'logos/filename'
        
        await supabase.storage
          .from('images')
          .remove([oldPath]);
      } catch (error) {
        // Ignore errors when deleting old logo
        console.warn('Could not delete old logo:', error);
      }
    }

    // Update company with new logo URL
    const { error: updateError } = await supabase
      .from("Company")
      .update({ logo: logoUrl })
      .eq("id", companyId);

    if (updateError) {
      // If update fails, try to delete the uploaded file
      await supabase.storage
        .from('images')
        .remove([filePath]);

      return NextResponse.json(
        { error: "Неуспешно обновяване на логото на компанията" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logoUrl,
    });
  } catch (error) {
    console.error("Грешка при качване на лого:", error);
    return NextResponse.json(
      { error: "Вътрешна сървърна грешка" },
      { status: 500 }
    );
  }
}
