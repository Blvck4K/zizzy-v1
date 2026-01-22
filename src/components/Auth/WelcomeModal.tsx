"use client";

import { PartyPopper } from "lucide-react";
import styles from "./WelcomeModal.module.css";
import { useEffect, useState } from "react";

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    userName?: string;
}

export default function WelcomeModal({ isOpen, onClose, userName }: WelcomeModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        } else {
            const timer = setTimeout(() => setIsVisible(false), 300); // Wait for animation
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    return (
        <div className={`${styles.overlay} ${isOpen ? styles.open : ''}`}>
            <div className={styles.modal}>
                <div className={styles.iconContainer}>
                    <PartyPopper size={48} className={styles.icon} />
                </div>
                <h2 className={styles.title}>Welcome to Zizzy!</h2>
                <p className={styles.message}>
                    We're thrilled to have you here{userName ? `, ${userName}` : ''}!
                    <br />
                    Get ready to supercharge your web development journey.
                </p>
                <div className={styles.actions}>
                    <button onClick={onClose} className={styles.button}>
                        Let's Get Started
                    </button>
                </div>
            </div>
        </div>
    );
}
