import { Activity, Zap, Server } from "lucide-react";
import styles from "./DeveloperWorkspace.module.css";
import { useUser } from "@/context/UserContext";
import { useState, useEffect } from "react";

export default function SystemStatus() {
    return (
        <div className={styles.systemStatus}>
            <div className={styles.statusItem}>
                <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>System Status is locked<br />Coming in v2</span>
            </div>
        </div>
    );
}
