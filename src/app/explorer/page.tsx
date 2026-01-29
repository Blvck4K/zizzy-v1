"use client";

import { Compass, BookOpen, BrainCircuit, Lightbulb, LucideIcon, Sparkles, ArrowRight, Clock, Star, Pin } from "lucide-react";
import styles from "./ExplorerPage.module.css";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export default function ExplorerPage() {
    const { history, selectChat } = useUser();
    const router = useRouter();

    const handlePromptClick = (text: string) => {
        const encoded = encodeURIComponent(text);
        router.push(`/?prompt=${encoded}`);
    };

    const hasActivity = history.length > 0;
    const pinnedChats = history.filter(c => c.pinned);

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <h1 className={styles.title}>
                        <Compass className="text-[var(--foreground)]" size={32} />
                        Explorer Hub
                    </h1>
                    <p className={styles.subtitle}>
                        Zizzy Explorer helps you explore, plan, and think with AI. {hasActivity
                            ? "Welcome back. Pick up where you left off or start fresh."
                            : "What are we exploring today?"}
                    </p>
                </div>
                <button
                    className={styles.startChatBtn}
                    onClick={() => router.push('/')}
                >
                    Start Chat <ArrowRight size={16} />
                </button>
            </header>
            <div className={styles.feedContainer}>
                <div className={styles.feedSection}>
                    <h3 className={styles.feedTitle}><Sparkles size={16} /> Trending Prompts</h3>
                    <div className={styles.feedList}>
                        <PromptItem
                            text="Explain how OAuth works in simple terms"
                            category="Knowledge"
                            onClick={() => handlePromptClick("Explain how OAuth works in simple terms")}
                        />
                        <PromptItem
                            text="Debug this React state issue"
                            category="Problem"
                            onClick={() => handlePromptClick("Help me debug a React state issue. Here is the code:")}
                        />
                        <PromptItem
                            text="Generate a SaaS idea for remote teams"
                            category="Idea"
                            onClick={() => handlePromptClick("Generate a SaaS idea for remote teams.")}
                        />
                    </div>
                </div>
                <div className={styles.feedSection}>
                    <h3 className={styles.feedTitle}><Star size={16} /> New in Zizzy</h3>
                    <div className={styles.feedList}>
                        <div className={styles.updateCard}>
                            <div className={styles.updateTitle}>Explorer Modes</div>
                            <p className={styles.updateDesc}>Specialized modes for Knowledge, Problem Solving, and Ideas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PromptItem({ text, category, onClick }: { text: string, category: string, onClick: () => void }) {
    return (
        <div className={styles.feedItem} onClick={onClick}>
            <div>
                <div className={styles.promptText}>{text}</div>
                <div className={styles.promptMeta}>{category}</div>
            </div>
            <ArrowRight size={14} className="text-[var(--muted-foreground)]" />
        </div>
    );
}
