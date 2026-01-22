"use client";

import { Compass, BookOpen, BrainCircuit, Lightbulb, LucideIcon } from "lucide-react";
import styles from "./ExplorerPage.module.css";

export default function ExplorerPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Compass className="text-[var(--foreground)]" size={32} />
                    Explorer Hub
                </h1>
                <p className={styles.subtitle}>
                    Discover the world, history, and knowledge. What are we exploring today?
                </p>
            </header>

            {/* Feature Cards */}
            <div className={styles.grid}>
                <Card
                    icon={BookOpen}
                    title="Ask Anything"
                    description="Get answers about history, science, trivia, and more."
                />
                <Card
                    icon={BrainCircuit}
                    title="Solve Problems"
                    description="Need help with logic, math, or reasoning? Just ask."
                />
                <Card
                    icon={Lightbulb}
                    title="Idea Generator"
                    description="Brainstorm ideas for projects, writing, or creative work."
                />
            </div>

            {/* Student Chat Area Proxy */}
            <div className={styles.ctaSection}>
                <div className={styles.ctaIcon}>
                    <Compass size={32} />
                </div>
                <h3 className={styles.ctaTitle}>Start an Exploration</h3>
                <p className={styles.ctaText}>
                    Switch to Explorer mode in the chat to start asking general questions. Zizzy is ready to help you learn!
                </p>
                <button className={styles.ctaButton}>
                    Open Explorer Chat
                </button>
            </div>
        </div>
    );
}

interface CardProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

function Card({ icon: Icon, title, description }: CardProps) {
    return (
        <div className={styles.card}>
            <div className={styles.cardIconContainer}>
                <Icon size={20} className="text-[var(--foreground)]" />
            </div>
            <h3 className={styles.cardTitle}>{title}</h3>
            <p className={styles.cardDesc}>{description}</p>
        </div>
    );
}
