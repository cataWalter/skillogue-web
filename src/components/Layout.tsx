import React from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

// Define the type for the component's props
interface LayoutProps {
    children: React.ReactNode;
}

/**
 * A reusable layout component that wraps page content with a standard
 * Navbar and Footer. It also provides the consistent dark background
 * and flex-column layout for the entire page.
 *
 * @param {LayoutProps} props - The component props, containing the children to render.
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-black text-white">
            <Navbar />
            {/* The 'flex-grow' class ensures the main content area expands
                to fill available space, pushing the footer down. */}
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
