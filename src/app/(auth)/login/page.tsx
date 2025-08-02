import { LoginForm } from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome Back!</h1>
                    <p className="text-muted-foreground">
                        Sign in to connect with others through your passions.
                    </p>
                </div>
                <div className="mt-8">
                    <LoginForm />
                </div>
                <div className="mt-6 text-center text-sm">
                    {"Don't have an account? "}
                    <Link href="/signup" className="font-semibold underline">
                        Sign up
                    </Link>
                </div>
            </div>
        </div>
    );
}