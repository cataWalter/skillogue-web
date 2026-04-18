import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { staticPageCopy } from '../../lib/app-copy';

const highlightAccentClasses = [
    'border-brand/20 bg-brand/10 text-brand-soft',
    'border-discovery/25 bg-discovery/10 text-discovery-soft',
    'border-connection/25 bg-connection/10 text-connection-soft',
] as const;

const itemNumberAccentClasses = [
    'bg-brand/10 text-brand-soft',
    'bg-discovery/10 text-discovery-soft',
    'bg-connection/10 text-connection-soft',
] as const;

export default function FAQPage() {
    return (
        <main className="editorial-shell min-h-screen py-8 text-foreground sm:py-12 lg:py-16">
            <div className="mx-auto max-w-5xl space-y-8">
                <Link href="/" className="mb-8 inline-flex items-center gap-2 text-faint transition hover:text-foreground">
                    <ArrowLeft size={20} />
                    {staticPageCopy.common.backToHome}
                </Link>

                <section className="glass-panel rounded-[2rem] p-8 sm:p-10">
                    <p className="editorial-kicker mb-4 w-fit border-discovery/25 bg-discovery/10 text-discovery-soft">
                        Questions, answered
                    </p>
                    <div className="max-w-3xl">
                        <h1 className="mb-4 text-4xl font-bold">{staticPageCopy.faq.title}</h1>
                        <p className="mb-4 max-w-2xl text-base text-faint sm:text-lg">
                            {staticPageCopy.faq.subtitle}
                        </p>
                        <p className="text-sm leading-relaxed text-muted sm:text-base">
                            {staticPageCopy.faq.intro}
                        </p>
                    </div>

                    <div className="mt-8 grid gap-4 md:grid-cols-3" aria-label="FAQ overview">
                        {staticPageCopy.faq.highlights.map((highlight, index) => (
                            <article key={highlight.title} className="glass-surface rounded-[1.5rem] p-5">
                                <p className={`editorial-kicker mb-4 w-fit ${highlightAccentClasses[index % highlightAccentClasses.length]}`}>
                                    Quick take {index + 1}
                                </p>
                                <h2 className="mb-2 text-lg font-semibold text-foreground">{highlight.title}</h2>
                                <p className="text-sm leading-relaxed text-faint">{highlight.body}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
                    <div className="space-y-6">
                        {staticPageCopy.faq.items.map((item, index) => (
                            <article key={item.question} className="glass-surface rounded-[1.5rem] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-brand/25">
                                <div className="mb-4 flex flex-wrap items-center gap-3">
                                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${itemNumberAccentClasses[index % itemNumberAccentClasses.length]}`}>
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p className="editorial-kicker w-fit border-line/50 bg-surface-secondary/70 text-muted">
                                        {item.category}
                                    </p>
                                </div>

                                <h2 className="mb-3 text-2xl font-semibold text-foreground">{item.question}</h2>
                                <p className="mb-4 text-base font-medium leading-relaxed text-foreground/90">{item.shortAnswer}</p>
                                <p className="leading-relaxed text-muted">{item.answer}</p>

                                <ul className="mt-5 space-y-3 text-sm text-faint">
                                    {item.highlights.map((highlight) => (
                                        <li key={highlight} className="flex items-start gap-3">
                                            <span className="mt-2 h-2 w-2 rounded-full bg-brand/70" aria-hidden="true" />
                                            <span>{highlight}</span>
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>

                    <aside className="glass-panel rounded-[1.75rem] p-6 lg:sticky lg:top-24">
                        <p className="editorial-kicker mb-4 w-fit border-brand/20 bg-brand/10 text-brand-soft">
                            Still need help?
                        </p>
                        <h2 className="mb-3 text-2xl font-semibold text-foreground">{staticPageCopy.faq.support.title}</h2>
                        <p className="mb-6 leading-relaxed text-faint">{staticPageCopy.faq.support.body}</p>
                        <Link
                            href="/contact"
                            className="inline-flex items-center gap-2 rounded-full bg-brand/15 px-5 py-3 text-sm font-semibold text-foreground transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand/20"
                        >
                            {staticPageCopy.faq.support.cta}
                            <ChevronRight size={16} />
                        </Link>
                    </aside>
                </section>
            </div>
        </main>
    );
}
