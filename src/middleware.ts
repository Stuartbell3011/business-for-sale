import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const protectedRoutes = ["/seller"];
	const isProtected = protectedRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

	if (!isProtected) {
		return NextResponse.next();
	}

	let supabaseResponse = NextResponse.next({ request });

	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
		{
			cookies: {
				getAll() {
					return request.cookies.getAll();
				},
				setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
					for (const { name, value } of cookiesToSet) {
						request.cookies.set(name, value);
					}
					supabaseResponse = NextResponse.next({ request });
					for (const { name, value, options } of cookiesToSet) {
						supabaseResponse.cookies.set(name, value, options);
					}
				},
			},
		},
	);

	const {
		data: { user },
	} = await supabase.auth.getUser();

	if (!user) {
		return NextResponse.redirect(new URL("/login", request.url));
	}

	return supabaseResponse;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
