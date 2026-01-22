"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, GraduationCap, Code2, Rocket, Mail, Check, X, Menu, LogIn, LogOut, UserPlus, History, Settings, Compass } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import SettingsModal from "../Settings/SettingsModal";
import { useUser } from "@/context/UserContext";
import HistoryPopup from "./HistoryPopup";

import WelcomeModal from "../Auth/WelcomeModal";

export default function Sidebar() {
    const [email, setEmail] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [joined, setJoined] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const {
        profileName, setProfileName,
        profileImage,
        history, clearCurrentChat,
        isWelcomeOpen, closeWelcomeModal
    } = useUser();
    const router = useRouter();
    const historyBtnRef = useRef<HTMLButtonElement>(null);


    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };

        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.refresh();
    };

    const pinnedHistory = history.filter(item => item.pinned);

    const keyNavItems = [
        {
            icon: MessageSquare,
            label: "New Chat",
            href: "/",
            active: true,
            onClick: (e: any) => {
                if (window.location.pathname === '/') {
                    e.preventDefault();
                    clearCurrentChat();
                }
            }
        },
    ];

    const secondaryNavItems = [
        { icon: Compass, label: "Explorer", href: "/explorer", active: false },
        { icon: Code2, label: "Developers", href: "/developers", active: false },
    ];

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setTimeout(() => setJoined(true), 500);
    };

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                className={styles.mobileToggle}
                onClick={() => setIsMobileOpen(true)}
                aria-label="Open Sidebar"
            >
                <Menu size={24} />
            </button>

            {/* Overlay */}
            {isMobileOpen && (
                <div
                    className={styles.overlay}
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <aside className={clsx(styles.sidebar, isMobileOpen && styles.sidebarOpen)}>
                {/* Mobile Close Button */}
                <button
                    className={styles.mobileClose}
                    onClick={() => setIsMobileOpen(false)}
                    aria-label="Close Sidebar"
                >
                    <X size={20} />
                </button>

                {/* Header / Logo */}
                <div className={styles.header}>
                    <div className={styles.logoContainer}>
                        <Image
                            src="/logo.png"
                            alt="Zizzy Logo"
                            fill
                            className={styles.logo}
                        />
                    </div>
                    <div>
                        <span className={styles.brandName}>Zizzy</span>
                        <p className={styles.tagline}>
                            Building the future of web dev
                        </p>
                    </div>
                </div>

                {/* Navigation */}
                <nav className={styles.nav}>
                    {keyNavItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={clsx(styles.navLink, item.active && styles.navLinkActive)}
                            onClick={(e) => {
                                setIsMobileOpen(false);
                                if (item.onClick) item.onClick(e);
                            }}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}

                    {/* History Toggle */}
                    <div className={styles.historyWrapper}>
                        <button
                            ref={historyBtnRef}
                            className={clsx(styles.navLink, isHistoryOpen && styles.activeHistory)}
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        >
                            <History size={18} />
                            History
                        </button>
                        <HistoryPopup
                            isOpen={isHistoryOpen}
                            onClose={() => setIsHistoryOpen(false)}
                            triggerRef={historyBtnRef}
                        />
                    </div>

                    {secondaryNavItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={clsx(styles.navLink, item.active && styles.navLinkActive)}
                            onClick={() => setIsMobileOpen(false)}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </Link>
                    ))}

                    <div className={styles.comingSoonSection}>
                        <div className={styles.comingSoonItem} title="Automated website building & management — coming soon">
                            <Rocket size={18} />
                            <div className={styles.comingSoonText}>
                                <span>Site Builder</span>
                                <span className={styles.comingSoonLabel}>Coming Soon</span>
                            </div>
                        </div>
                    </div>

                    {/* Pinned Items */}
                    {pinnedHistory.length > 0 && (
                        <div className={styles.pinnedSection}>
                            <div className={styles.pinnedHeader}>Pinned</div>
                            {pinnedHistory.map(item => (
                                <div key={item.id} className={styles.pinnedItem}>
                                    <span className={styles.pinnedTitle}>{item.title}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </nav>

                {/* Footer / Auth & Early Access */}
                <div className={styles.footer}>
                    {user ? (
                        <button
                            onClick={handleSignOut}
                            className={styles.signOutBtn}
                        >
                            <LogOut size={16} />
                            Sign Out
                        </button>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link href="/login" className={styles.signInBtn}>
                                <LogIn size={16} />
                                Sign In
                            </Link>
                            {!joined ? (
                                !showForm ? (
                                    <button
                                        onClick={() => setShowForm(true)}
                                        className={styles.earlyAccessBtn}
                                    >
                                        <Mail size={14} />
                                        Waitlist
                                    </button>
                                ) : (
                                    <form onSubmit={handleJoin} className={styles.form}>
                                        <div className={styles.inputGroup}>
                                            <input
                                                type="email"
                                                placeholder="email@example.com"
                                                className={styles.input}
                                                value={email}
                                                onChange={e => setEmail(e.target.value)}
                                                autoFocus
                                            />
                                            <button type="button" onClick={() => setShowForm(false)} className={styles.closeBtn}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <button type="submit" className={styles.submitBtn}>
                                            Join
                                        </button>
                                    </form>
                                )
                            ) : (
                                <div className={styles.successMessage}>
                                    <Check size={14} />
                                    <span>Joined!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.footerBottom}>
                    <button
                        onClick={() => setIsSettingsOpen(true)}
                        className={styles.settingsBtn}
                        title="Settings"
                    >
                        <Settings size={20} />
                    </button>
                    {user && (
                        <div className={styles.userProfile}>
                            <div className={styles.userAvatar}>
                                {profileImage ? (
                                    <img src={profileImage} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                ) : (
                                    <span className={styles.userInitials}>{profileName.charAt(0)}</span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </aside>

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSaveProfile={(name) => setProfileName(name)}
                currentName={profileName}
                userEmail={user?.email}
            />

            <WelcomeModal
                isOpen={isWelcomeOpen}
                onClose={closeWelcomeModal}
                userName={profileName !== "Friend" ? profileName : undefined}
            />
        </>
    );
}
