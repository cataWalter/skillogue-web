import Header from '@/components/Header';
import Footer from '@/components/Footer';

// This mock user would typically come from a session or auth provider
const user = {
  name: 'Jane Doe',
};

export default function Dashboard() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
      <Header />
      <main className="flex-grow container mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {user ? user.name : 'Guest'}!
        </h1>
        <p className="mt-4 text-gray-600">
          This is your personalized space. From here, you can manage your profile, discover new people, and check your messages.
        </p>
      </main>
      <Footer />
    </div>
  );
}