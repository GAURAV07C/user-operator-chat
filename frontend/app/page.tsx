import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 space-y-6 bg-background">
      <h1 className="text-4xl font-bold text-center">Chat Support System</h1>
      <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
        <Link href="/login">
          <Button size="lg" className="w-full">
            Login
          </Button>
        </Link>
        <Link href="/signup">
          <Button size="lg" variant="outline" className="w-full">
            Sign Up
          </Button>
        </Link>
      </div>
      <div className="mt-8 text-center text-muted-foreground">
        <p>Choose your role:</p>
        <div className="flex flex-col space-y-4 mt-4 sm:flex-row sm:space-y-0 sm:space-x-4">
          <Link href="/user/request">
            <Button variant="secondary" className="w-full">
              User Portal
            </Button>
          </Link>
          <Link href="/operator/home">
            <Button variant="secondary" className="w-full">
              Operator Portal
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
