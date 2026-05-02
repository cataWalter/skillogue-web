import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Have a question, suggestion, or need help? Get in touch with the Skillogue team.',
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
