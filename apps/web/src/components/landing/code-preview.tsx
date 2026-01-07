export function CodePreview() {
    return (
        <section className="relative py-32 overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-sky-500/5 to-transparent" />

            <div className="relative mx-auto max-w-7xl px-6">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left content */}
                    <div>
                        <p className="text-sm font-semibold text-sky-400 mb-3">Built for developers</p>
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                            See your workflows come to life
                        </h2>
                        <p className="mt-4 text-lg text-muted-foreground">
                            Watch your automations run in real-time. Debug issues, monitor performance,
                            and optimize your workflows with built-in observability tools.
                        </p>

                        <ul className="mt-8 space-y-4">
                            {[
                                'Real-time execution logs and debugging',
                                'Visual node-by-node execution tracking',
                                'Built-in error handling and retries',
                                'Performance metrics and analytics',
                            ].map((item) => (
                                <li key={item} className="flex items-center gap-3 text-sm">
                                    <svg className="h-5 w-5 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                    <span className="text-muted-foreground">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Right - Code window */}
                    <div className="relative">
                        {/* Glow behind */}
                        <div className="absolute -inset-4 bg-gradient-to-r from-sky-500/20 to-purple-500/20 rounded-2xl blur-2xl opacity-50" />

                        {/* Window */}
                        <div className="relative rounded-xl border border-white/10 bg-[#0d1117] overflow-hidden shadow-2xl">
                            {/* Title bar */}
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex gap-1.5">
                                    <div className="h-3 w-3 rounded-full bg-[#ff5f56]" />
                                    <div className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                                    <div className="h-3 w-3 rounded-full bg-[#27c93f]" />
                                </div>
                                <span className="ml-3 text-xs text-muted-foreground font-mono">welcome-email.workflow.json</span>
                            </div>

                            {/* Code content */}
                            <div className="p-6 overflow-x-auto">
                                <pre className="text-[13px] leading-relaxed font-mono">
                                    <code>
                                        <span className="text-white/40">{'{'}</span>{'\n'}
                                        <span className="text-white/40">  </span><span className="text-sky-300">&quot;name&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;Welcome Email Automation&quot;</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">  </span><span className="text-sky-300">&quot;trigger&quot;</span><span className="text-white/40">: {'{'}</span>{'\n'}
                                        <span className="text-white/40">    </span><span className="text-sky-300">&quot;type&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;webhook&quot;</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">    </span><span className="text-sky-300">&quot;path&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;/api/new-signup&quot;</span>{'\n'}
                                        <span className="text-white/40">  {'}'}</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">  </span><span className="text-sky-300">&quot;nodes&quot;</span><span className="text-white/40">: [</span>{'\n'}
                                        <span className="text-white/40">    {'{'}</span>{'\n'}
                                        <span className="text-white/40">      </span><span className="text-sky-300">&quot;name&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;Send Welcome Email&quot;</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">      </span><span className="text-sky-300">&quot;type&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;gmail.send&quot;</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">      </span><span className="text-sky-300">&quot;template&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;welcome&quot;</span>{'\n'}
                                        <span className="text-white/40">    {'}'}</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">    {'{'}</span>{'\n'}
                                        <span className="text-white/40">      </span><span className="text-sky-300">&quot;name&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;Add to Notion&quot;</span><span className="text-white/40">,</span>{'\n'}
                                        <span className="text-white/40">      </span><span className="text-sky-300">&quot;type&quot;</span><span className="text-white/40">: </span><span className="text-amber-300">&quot;notion.create&quot;</span>{'\n'}
                                        <span className="text-white/40">    {'}'}</span>{'\n'}
                                        <span className="text-white/40">  ]</span>{'\n'}
                                        <span className="text-white/40">{'}'}</span>
                                    </code>
                                </pre>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
