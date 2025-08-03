export default function Footer() {
  return (
    <footer className="py-6 bg-white border-t">
      <div className="container mx-auto text-center text-gray-500">
        <p>&copy; {new Date().getFullYear()} Skillogue. All rights reserved.</p>
      </div>
    </footer>
  );
}