"use client";

import { Code2, Terminal, Layers, Cpu, LucideIcon } from "lucide-react";
import styles from "./DevelopersPage.module.css";

export default function DevelopersPage() {
    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <Code2 className="text-[var(--foreground)]" size={32} />
                    Developer Workspace
                </h1>
                <p className={styles.subtitle}>
                    Production-grade answers, architecture reviews, and advanced debugging.
                </p>
            </header>

            {/* Feature Cards */}
            <div className={styles.grid}>
                <Card
                    icon={Terminal}
                    title="Code Review"
                    description="Analyze code for performance, security, and cleanliness."
                />
                <Card
                    icon={Layers}
                    title="Architecture Planning"
                    description="Design scalable systems and database schemas."
                />
                <Card
                    icon={Cpu}
                    title="Tech Stack Advice"
                    description="Compare frameworks and tools for your specific use case."
                />
            </div>

            <div className={styles.placeholderSection}>
                <p className={styles.placeholderText}>Dev tools integration coming soon...</p>
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
