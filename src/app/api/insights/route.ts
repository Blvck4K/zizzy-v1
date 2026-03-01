import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase Client (Service Role if needed, but here we use User Context preferably)
// Ideally we forward the auth token. For simplicity in this specialized route, we can use the standard client 
// if defined in lib, but server-side often needs cookies.
// Let's assume standard client-side auth via headers or create a client from cookies. 
// For this MVP, we will use a direct client construction if needed or reuse a server helper.
// Checking project structure... usually in Next.js App Router we use @supabase/auth-helpers-nextjs or @supabase/ssr.
// I'll stick to a basic generic implementation first.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(req: NextRequest) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    // In a real app, we should get the user from the session using the request cookies/headers
    // to properly respect RLS.
    // For now, assuming the client sends the auth header automatically or we need to extract it.

    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        // Only set auth if header exists
        supabase.auth.setSession({
            access_token: authHeader.replace('Bearer ', ''),
            refresh_token: '',
        });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('insights')
        .select('*')
        .eq('user_id', user.id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ insights: data });
}

export async function POST(req: NextRequest) {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Auth handling
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
        supabase.auth.setSession({
            access_token: authHeader.replace('Bearer ', ''),
            refresh_token: '',
        });
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { text, pinned = false } = body;

        if (!text) return NextResponse.json({ error: "Text required" }, { status: 400 });

        // Simple validation or summarization could happen here if text is huge
        // For 'Mark as Decision', user usually marks a block of text.

        const { data, error } = await supabase
            .from('insights')
            .insert({
                user_id: user.id,
                summary: text,
                pinned
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ insight: data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
