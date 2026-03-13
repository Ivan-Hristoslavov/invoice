import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { resolveSessionUser } from "@/lib/session-user";
import { z } from "zod";

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
  bulstatNumber: z.string().optional().or(z.literal("")),
  vatRegistered: z.boolean().optional().default(false),
  vatRegistrationNumber: z.string().optional().or(z.literal("")),
  mol: z.string().optional().or(z.literal("")),
  uicType: z.enum(["BULSTAT", "EGN"]).optional().default("BULSTAT"),
  locale: z.string().default("bg"),
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Сесията ви е невалидна. Моля, влезте отново." }, { status: 401 });
    }

    const { id } = await context.params;
    const supabase = createAdminClient();

    const { data: client, error } = await supabase
      .from("Client")
      .select("*")
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    return NextResponse.json(client);
  } catch (error) {
    console.error("Грешка при извличане на клиент:", error);
    return NextResponse.json(
      { error: "Неуспешно извличане на клиент" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Неоторизиран достъп" }, { status: 401 });
    }

    const sessionUser = await resolveSessionUser(session.user);
    if (!sessionUser) {
      return NextResponse.json({ error: "Сесията ви е невалидна. Моля, влезте отново." }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json();
    const validated = clientSchema.parse(json);

    const supabase = createAdminClient();

    const { data: existingClient, error: existingClientError } = await supabase
      .from("Client")
      .select("id")
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .single();

    if (existingClientError || !existingClient) {
      return NextResponse.json({ error: "Клиентът не е намерен" }, { status: 404 });
    }

    const { data: client, error } = await supabase
      .from("Client")
      .update({
        name: validated.name,
        email: validated.email || null,
        phone: validated.phone || null,
        address: validated.address || null,
        city: validated.city || null,
        state: validated.state || null,
        zipCode: validated.zipCode || null,
        country: validated.country || null,
        vatNumber: validated.vatNumber || null,
        taxIdNumber: validated.taxIdNumber || null,
        bulstatNumber: validated.bulstatNumber || null,
        vatRegistered: validated.vatRegistered ?? false,
        vatRegistrationNumber: validated.vatRegistrationNumber || null,
        mol: validated.mol || null,
        uicType: validated.uicType ?? "BULSTAT",
        locale: validated.locale || "bg",
        updatedAt: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("userId", sessionUser.id)
      .select()
      .single();

    if (error || !client) {
      throw error;
    }

    return NextResponse.json(client);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Неуспешна валидация", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Грешка при обновяване на клиент:", error);
    return NextResponse.json(
      { error: "Неуспешно обновяване на клиент" },
      { status: 500 }
    );
  }
}
