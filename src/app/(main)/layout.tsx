import { SignOutButton } from "@/components/common/Button";
import Link from "next/link";

export default function MainAppLayout({
                                          children,
                                      }: {
    children: React.ReactNode;
}) {
    return (
        <div>
            <header className="border-b">
                <nav className="container mx-auto flex items-center justify-between p-4">
                    <Link href="/discover" className="text-xl font-bold">
                        Skillogue
                    </Link>
                    <SignOutButton />
                </nav>
            </header>
            <main className="container mx-auto p-4">
                {children}
            </main>
        </div>
    );
}