import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="py-4 px-6 md:px-12 border-b bg-white">
        <nav className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-gray-800">
            Skillogue
          </Link>
          <div className="space-x-4">
            <Button asChild variant="ghost">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Sign Up</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="text-center py-20 md:py-32 bg-white">
          <div className="container mx-auto px-6">
            <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
              Connect Through Passions,
              <br />
              <span className="text-blue-600">Not Pictures.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-600">
              Skillogue is a unique social platform designed to connect people based on their shared interests and skills. Forget the visual noise; we focus on genuine connection.
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/discover">Discover People</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800">Why Skillogue?</h2>
              <p className="mt-4 text-gray-600">A space where shared hobbies can flourish into meaningful relationships.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
              <div className="feature">
                <h3 className="text-xl font-semibold mb-2">Focus on Personality</h3>
                <p className="text-gray-600">With randomized profile pictures, your personality and passions are what truly shine. First impressions are based on who you are, not what you look like.</p>
              </div>
              <div className="feature">
                <h3 className="text-xl font-semibold mb-2">Discover & Connect</h3>
                <p className="text-gray-600">Our advanced filtering lets you find others based on shared passions, location, age, and more. Found someone interesting? Start a conversation with our real-time private messaging.</p>
              </div>
              <div className="feature">
                <h3 className="text-xl font-semibold mb-2">Safety and Trust</h3>
                <p className="text-gray-600">Your safety is our priority. With profile verification and easy-to-use reporting tools, we're building a trustworthy community for everyone.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-white border-t">
        <div className="container mx-auto text-center text-gray-500">
          <p>&copy; {new Date().getFullYear()} Skillogue. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}