import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import cuid from "cuid";

// Define validation schema for client
const clientSchema = z.object({
  name: z.string().min(1, "Името на клиента е задължително"),
  email: z.string().email("Моля, въведете валиден имейл").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  state: z.string().optional().or(z.literal("")),
  zipCode: z.string().optional().or(z.literal("")),
  country: z.string().optional().or(z.literal("")),
  vatNumber: z.string().optional().or(z.literal("")),
  taxIdNumber: z.string().optional().or(z.literal("")),
  
  // Bulgarian-specific fields
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  
  locale: z.string().default("bg"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json(
        { error: "Неоторизиран достъп" },
        { status: 401 }
      );
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("query") || "";
    
    const supabase = createAdminClient();
    
    let clientQuery = supabase
      .from("Client")
      .select("*")
      .eq("userId", session.user.id);
    
    const { data: allClients, error } = await clientQuery;
    
    if (error) {
      throw error;
    }
    
    let clients = allClients || [];
    
    // Filter by query if provided
    if (query) {
      const queryLower = query.toLowerCase();
      clients = clients.filter((client: any) => 
        client.name?.toLowerCase().includes(queryLower) ||
        client.email?.toLowerCase().includes(queryLower) ||
        client.city?.toLowerCase().includes(queryLower) ||
        client.country?.toLowerCase().includes(queryLower)
      );
    }
    
    // Sort by name
    clients.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Грешка при извличане на клиенти:", error);
    // Return empty array instead of error to allow graceful degradation
    return NextResponse.json([]);
  }
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

    // Check subscription limits - брой клиенти
    const { checkSubscriptionLimits } = await import("@/middleware/subscription");
    const clientLimitCheck = await checkSubscriptionLimits(
      session.user.id as string,
      'clients'
    );
    
    if (!clientLimitCheck.allowed) {
      return NextResponse.json(
        { error: clientLimitCheck.message || "Достигнат е лимитът за клиенти за вашия план" },
        { status: 403 }
      );
    }

    // Parse and validate the data
    const json = await request.json();
    const validatedData = clientSchema.parse(json);
    
    const supabase = createAdminClient();
    
    // Create the client
    const clientId = cuid();
    const { data: client, error } = await supabase
      .from("Client")
      .insert({
        id: clientId,
        ...validatedData,
        userId: session.user.id,
        updatedAt: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }

    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Грешка при създаване на клиент:", error);
    
    // Return validation errors if present
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Неуспешно създаване на клиент" },
      { status: 500 }
    );
  }
} 