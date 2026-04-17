"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);
	const supabase = createClient();

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		if (password.length < 8) {
			toast.error("Password must be at least 8 characters");
			return;
		}

		if (password !== confirmPassword) {
			toast.error("Passwords do not match");
			return;
		}

		setLoading(true);

		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${window.location.origin}/auth/callback`,
			},
		});

		if (error) {
			toast.error(error.message);
			setLoading(false);
			return;
		}

		setSubmitted(true);
		setLoading(false);
	}

	if (submitted) {
		return (
			<Card className="w-full max-w-sm">
				<CardHeader className="text-center">
					<CardTitle className="text-2xl">Check Your Email</CardTitle>
					<CardDescription>
						We&apos;ve sent a confirmation link to <strong>{email}</strong>. Click it to activate
						your account.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-center text-sm text-muted-foreground">
						Already confirmed?{" "}
						<Link href="/login" className="font-medium underline hover:text-foreground">
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="w-full max-w-sm">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl">Create Account</CardTitle>
				<CardDescription>Sign up to list or browse businesses</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="you@example.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input
							id="password"
							type="password"
							placeholder="Min 8 characters"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="confirm-password">Confirm Password</Label>
						<Input
							id="confirm-password"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							minLength={8}
						/>
					</div>
					<Button type="submit" className="w-full" disabled={loading}>
						{loading ? "Creating account..." : "Sign Up"}
					</Button>
				</form>
				<p className="mt-4 text-center text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="font-medium underline hover:text-foreground">
						Sign in
					</Link>
				</p>
			</CardContent>
		</Card>
	);
}
