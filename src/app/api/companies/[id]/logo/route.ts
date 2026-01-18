import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
        { error: "Company not found" },
        { status: 404 }
      );
    }

    // Delete logo from storage if exists
    if (company.logo) {
      try {
        // Extract file path from logo URL
        const logoUrl = new URL(company.logo);
        const filePath = logoUrl.pathname.split('/').slice(-2).join('/'); // Get 'logos/filename'
        
        const { error: deleteError } = await supabase.storage
          .from('images')
          .remove([filePath]);

        if (deleteError) {
          console.warn('Could not delete logo from storage:', deleteError);
        }
      } catch (error) {
        console.warn('Error parsing logo URL:', error);
      }
    }

    // Update company to remove logo URL
    const { error: updateError } = await supabase
      .from("Company")
      .update({ logo: null })
      .eq("id", companyId);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to delete logo" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error deleting logo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
