import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { checkSubscriptionLimits } from "@/middleware/subscription";
import { MAX_LOGO_SIZE_BYTES, STORAGE_BUCKET_IMAGES } from "@/config/constants";

/**
 * Detects image MIME type from magic bytes (first bytes of file).
 * Returns null if the buffer doesn't match any known image format.
 */
function detectImageMimeType(buffer: Buffer): string | null {
  if (buffer.length < 4) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 && buffer[1] === 0x50 &&
    buffer[2] === 0x4E && buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  // GIF: 47 49 46 38
  if (
    buffer[0] === 0x47 && buffer[1] === 0x49 &&
    buffer[2] === 0x46 && buffer[3] === 0x38
  ) {
    return 'image/gif';
  }
  // WebP: 52 49 46 46 ... 57 45 42 50
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 && buffer[1] === 0x49 &&
    buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 &&
    buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return 'image/webp';
  }
  // SVG: starts with '<svg' or '<?xml' (text-based, check prefix)
  const prefix = buffer.slice(0, 256).toString('utf8').trimStart();
  if (prefix.startsWith('<svg') || prefix.startsWith('<?xml')) {
    return 'image/svg+xml';
  }

  return null;
}

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

    // Validate file size first (cheap check)
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Размерът на файла надвишава ${MAX_LOGO_SIZE_BYTES / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // Validate file content using magic bytes (not just MIME type which can be spoofed)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const detectedMime = detectImageMimeType(buffer);
    if (!detectedMime || !allowedMimeTypes.includes(detectedMime)) {
      return NextResponse.json(
        { error: "Невалиден тип файл. Позволени са само JPEG, PNG, GIF, WebP и SVG изображения." },
        { status: 400 }
      );
    }

    // Sanitize filename extension based on detected type
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
    };
    const safeExt = mimeToExt[detectedMime];

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

    // Generate unique filename using the verified safe extension
    const fileName = `${companyId}-${Date.now()}.${safeExt}`;
    const filePath = `logos/${fileName}`;

    // buffer already read above for magic byte check
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET_IMAGES)
      .upload(filePath, buffer, {
        contentType: detectedMime,
        upsert: false,
      });

    if (uploadError) {
      console.error('Грешка при качване в Supabase storage:', uploadError);
      return NextResponse.json(
        { error: "Неуспешно качване на файла в хранилището" },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET_IMAGES)
      .getPublicUrl(filePath);

    const logoUrl = urlData.publicUrl;

    // Delete old logo if exists
    if (company.logo) {
      try {
        // Extract file path from old logo URL
        const oldUrl = new URL(company.logo);
        const oldPath = oldUrl.pathname.split('/').slice(-2).join('/'); // Get 'logos/filename'
        
        await supabase.storage
          .from(STORAGE_BUCKET_IMAGES)
          .remove([oldPath]);
      } catch (error) {
        // Ignore errors when deleting old logo
        console.warn('Could not delete old logo:', error);
      }
    }

    // Update company with new logo URL (scope to owner)
    const { error: updateError } = await supabase
      .from("Company")
      .update({ logo: logoUrl })
      .eq("id", companyId)
      .eq("userId", session.user.id as string);

    if (updateError) {
      // If update fails, try to delete the uploaded file
      await supabase.storage
        .from(STORAGE_BUCKET_IMAGES)
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
