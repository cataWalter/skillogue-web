// src/app/auth/auth-code-error/page.tsx

import Link from "next/link";

export default function AuthCodeError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full text-center p-8 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-red-600">Verification Failed</h1>
        <p className="mt-4 text-gray-600">
          The link you used is either invalid or has expired. Please try signing up or requesting a new verification email again.
        </p>
        <Link href="/login" legacyBehavior>
          <a className="mt-6 inline-block w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg">
            Return to Login
          </a>
        </Link>
      </div>
    </div>
  );
}