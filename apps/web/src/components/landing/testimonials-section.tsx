import { Star } from 'lucide-react';

const testimonials = [
    {
        content: "Conduit has completely transformed how we handle our workflows. What used to take hours of manual work now happens automatically in the background.",
        author: "Sarah Chen",
        role: "Head of Operations",
        company: "TechFlow Inc.",
        avatar: "SC",
    },
    {
        content: "The template library is incredible. We found a template for almost every use case and deployed 15 automations in our first week.",
        author: "Marcus Johnson",
        role: "CTO",
        company: "StartupXYZ",
        avatar: "MJ",
    },
    {
        content: "Finally, a no-code automation tool that doesn't compromise on power. The n8n integration means we can build anything we need.",
        author: "Emily Rodriguez",
        role: "Product Manager",
        company: "Scale Systems",
        avatar: "ER",
    },
    {
        content: "We've automated our entire customer onboarding flow. Response times dropped from 24 hours to under 5 minutes.",
        author: "David Kim",
        role: "Customer Success Lead",
        company: "CloudBase",
        avatar: "DK",
    },
    {
        content: "The visual workflow builder is so intuitive that our non-technical team members are now building their own automations.",
        author: "Lisa Thompson",
        role: "Marketing Director",
        company: "GrowthLabs",
        avatar: "LT",
    },
    {
        content: "Enterprise-grade security with startup-level simplicity. Conduit checked all our compliance boxes while being easy to use.",
        author: "James Wilson",
        role: "Security Engineer",
        company: "SecureStack",
        avatar: "JW",
    },
];

export function TestimonialsSection() {
    return (
        <section className="relative py-32">
            {/* Top border line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-[var(--line-color)]" />
            <div className="mx-auto max-w-7xl px-6">
                {/* Header */}
                <div className="text-center max-w-2xl mx-auto mb-16">
                    <p className="text-sm font-semibold text-sky-400 mb-3">Testimonials</p>
                    <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                        Loved by teams everywhere
                    </h2>
                    <p className="mt-4 text-lg text-muted-foreground">
                        See what our customers have to say about Conduit.
                    </p>
                </div>

                {/* Testimonials grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 hover:bg-white/[0.04] transition-colors"
                        >
                            {/* Stars */}
                            <div className="flex gap-1 mb-4">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                                &quot;{testimonial.content}&quot;
                            </p>

                            {/* Author */}
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 to-purple-500 flex items-center justify-center text-xs font-semibold text-white">
                                    {testimonial.avatar}
                                </div>
                                <div>
                                    <p className="text-sm font-medium">{testimonial.author}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {testimonial.role}, {testimonial.company}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
