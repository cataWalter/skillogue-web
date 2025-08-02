import { SignupForm } from "@/components/auth/SignupForm";
import Link from "next/link";

export default function SignupPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
            <div className="w-full max-w-md rounded-lg border p-6 shadow-sm">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Create an Account</h1>
                    <p className="text-muted-foreground">
                        Join Skillogue and start connecting.
                    </p>
                </div>
                <div className="mt-8">
                    <SignupForm />
                </div>
                <div className="mt-6 text-center text-sm">
                    {"Already have an account? "}
                    <Link href="/login" className="font-semibold underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}