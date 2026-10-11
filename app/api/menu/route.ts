import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const restaurantId = process.env.RESTAURANT_ID;

  if (!url || !key || !restaurantId) {
    return NextResponse.json({
      items: [],
      configured: false,
    });
  }

  const db = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await db
    .from("menu_items")
    .select(
      "id,name,description,price,image_path,is_veg,available,category_id,menu_categories(name)"
    )
    .eq("restaurant_id", restaurantId)
    .eq("archived", false)
    .eq("available", true)
    .order("name");

  if (error) {
    console.error("Menu fetch failed:", error.message);

    return NextResponse.json(
      { error: "Menu is temporarily unavailable." },
      { status: 500 }
    );
  }

  const items = (data ?? []).map((item) => {
    // Explicitly normalize the joined category relation.
    const categoryRelation = item.menu_categories as unknown as
      | { name: string | null }
      | { name: string | null }[]
      | null;

    const category = Array.isArray(categoryRelation)
      ? categoryRelation[0]?.name
      : categoryRelation?.name;

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      imagePath: item.image_path,
      vegetarian: item.is_veg,
      category: category || "Menu",
    };
  });

  return NextResponse.json(
    { items, configured: true },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}
