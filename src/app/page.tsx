import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          SaaS Dashboard
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          A performance-first analytics dashboard for tracking your business
          metrics. Monitor revenue, user growth, and key performance indicators
          in real-time.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link href="/auth/signin">
            <Button size="lg">Sign In</Button>
          </Link>
          <Link href="/auth/signup">
            <Button variant="outline" size="lg">
              Create Account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
