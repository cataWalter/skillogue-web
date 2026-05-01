'use client';

import Link from 'next/link';
import { useAuth } from '../hooks/useAuth';
import { isAdminEmail } from '../lib/admin';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, Settings, LogOut, Heart, MessageCircle, Bell, Search, ShieldAlert } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { componentCopy } from '../lib/app-copy';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, signOut, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const firstFocusable = mobileMenuRef.current.querySelector<HTMLElement>('a, button');
      firstFocusable?.focus();
    }
  }, [mobileMenuOpen]);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
    router.replace('/');
    router.refresh();
  };

  const navItems = user ? [
    ...(isAdminEmail(user.email) ? [{ href: '/admin', icon: ShieldAlert, label: 'Admin' }] : []),
    { href: '/search', icon: Search, label: componentCopy.navbar.search },
    { href: '/favorites', icon: Heart, label: componentCopy.navbar.favorites },
    { href: '/messages', icon: MessageCircle, label: componentCopy.navbar.messages },
    { href: '/notifications', icon: Bell, label: componentCopy.navbar.notifications },
    { href: '/profile', icon: User, label: componentCopy.navbar.profile },
    { href: '/settings', icon: Settings, label: componentCopy.navbar.settings },
  ] : [];

  return (
    <nav className="bg-[var(--glass-bg)] border-[var(--glass-border)] backdrop-blur-glass border-b sticky top-0 z-50 transition-colors duration-300">
      <div className="px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={user ? '/dashboard' : '/'}
            className="text-xl font-bold bg-gradient-to-r from-brand-start to-brand-end bg-clip-text text-transparent"
          >
            Skillogue
          </Link>

          <div className="flex items-center gap-3">
            {/* Desktop Navigation */}
            {!loading && user && (
              <div className="hidden md:flex items-center space-x-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition ${isActive(item.href)
                      ? 'bg-surface-secondary text-foreground'
                      : 'text-faint hover:text-foreground hover:bg-surface-secondary'
                      }`}
                  >
                    <item.icon size={18} />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => void handleSignOut()}
                  className="flex items-center gap-2 px-3 py-2 text-faint hover:text-foreground hover:bg-surface-secondary rounded-lg transition"
                >
                  <LogOut size={18} />
                  <span className="text-sm">{componentCopy.navbar.signOut}</span>
                </button>
              </div>
            )}

            {!loading && !user && (
              <div className="hidden md:flex items-center">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full bg-gradient-to-r from-brand-start to-brand-end px-5 py-2 text-sm font-semibold text-white transition-all duration-300 hover:shadow-glass-glow hover:from-brand-start-hover hover:to-brand-end-hover hover:-translate-y-0.5"
                >
                  {componentCopy.navbar.logIn}
                </Link>
              </div>
            )}

            <ThemeToggle />

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? componentCopy.navbar.closeNavigationMenu : componentCopy.navbar.openNavigationMenu}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              className="md:hidden p-2 text-faint hover:text-foreground"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div id="mobile-navigation" ref={mobileMenuRef} className="md:hidden bg-surface border-b border-line/30">
          <div className="px-4 py-2 space-y-1">
            {loading ? null : user ? (
              <>
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition ${isActive(item.href)
                      ? 'bg-surface-secondary text-foreground'
                      : 'text-faint hover:text-foreground hover:bg-surface-secondary'
                      }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={() => void handleSignOut()}
                  className="flex items-center gap-3 w-full px-3 py-3 text-faint hover:text-foreground hover:bg-surface-secondary rounded-lg transition"
                >
                  <LogOut size={18} />
                  <span>{componentCopy.navbar.signOut}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-faint hover:text-foreground hover:bg-surface-secondary rounded-lg transition"
                >
                  {componentCopy.navbar.signIn}
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 text-brand hover:text-brand-soft hover:bg-surface-secondary rounded-lg transition"
                >
                  {componentCopy.navbar.signUp}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
