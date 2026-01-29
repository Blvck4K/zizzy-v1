"use client";

import styles from "./DevelopersPage.module.css";
import { Lock } from "lucide-react";

export default function DevelopersPage() {
    return (
        <div className={styles.container}>
            <div className={styles.placeholderSection}>
                <div style={{ textAlign: "center" }}>
                    <Lock size={48} style={{ color: "var(--muted-foreground)", marginBottom: 16 }} />
                    <h2 className={styles.title}>Developer Tools Locked</h2>
                    <p className={styles.placeholderText}>
                        Zizzy’s Developer tools are currently locked and will be available in a future release.<br />
                        Right now, you can explore, plan, and learn in the Explorer section.
                    </p>
                    <span className={styles.comingSoonLabel} style={{ marginTop: 12, display: "inline-block", color: "var(--muted-foreground)", fontWeight: 600, fontSize: 14 }}>
                        Coming in v2
                    </span>
                </div>
            </div>
        </div>
    );
}
