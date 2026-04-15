import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl">
        <h1 className="text-5xl font-bold tracking-tight">BizAcquire</h1>
        <p className="text-xl text-muted-foreground">
          Discover, evaluate, and acquire small businesses with AI and location
          intelligence.
        </p>
        <div className="flex gap-3">
          <Button asChild size="lg">
            <Link href="/marketplace">Browse Listings</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/seller/onboard">List Your Business</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
