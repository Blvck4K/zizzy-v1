"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare, GraduationCap, Code2, Rocket, X, Menu, LogIn, LogOut, UserPlus, History, Settings, Compass, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import styles from "./Sidebar.module.css";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import SettingsModal from "../Settings/SettingsModal";
import { useUser } from "@/context/UserContext";
import HistoryPopup from "./HistoryPopup";


export default function Sidebar() {

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const {
        profileName, setProfileName,
        profileImage,
        history, clearCurrentChat,
        // ...existing code...
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

            <aside className={clsx(styles.sidebar, isMobileOpen && styles.sidebarOpen, isCollapsed && styles.collapsed)}>
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
                    <div className={styles.headerTop}>
                        <div className={styles.logoContainer}>
                            <div className={styles.logoDark}>
                                <Image
                                    src="/logo.png"
                                    alt="Zizzy Logo"
                                    fill
                                    className={styles.logo}
                                />
                            </div>
                            <div className={styles.logoLight}>
                                <Image
                                    src="/zizzy-light.png"
                                    alt="Zizzy Logo"
                                    fill
                                    className={styles.logo}
                                />
                            </div>
                        </div>
                        <button
                            className={styles.collapseBtn}
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                        >
                            {isCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
                        </button>
                    </div>

                    <div className={styles.brandInfo}>
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
                            title={isCollapsed ? item.label : undefined}
                        >
                            <item.icon size={18} />
                            <span className={styles.navText}>{item.label}</span>
                        </Link>
                    ))}

                    {/* History Toggle */}
                    <div className={styles.historyWrapper}>
                        <button
                            ref={historyBtnRef}
                            className={clsx(styles.navLink, isHistoryOpen && styles.navLinkActive)}
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            title={isCollapsed ? "History" : undefined}
                        >
                            <History size={18} />
                            <span className={styles.navText}>History</span>
                        </button>
                        <HistoryPopup
                            isOpen={isHistoryOpen}
                            onClose={() => setIsHistoryOpen(false)}
                            triggerRef={historyBtnRef}
                        />
                    </div>

                    {/* Explorer nav item (active) */}
                    <Link
                        key="Explorer"
                        href="/explorer"
                        className={clsx(styles.navLink)}
                        onClick={() => setIsMobileOpen(false)}
                        title={isCollapsed ? "Explorer" : undefined}
                    >
                        <Compass size={18} />
                        <span className={styles.navText}>Explorer</span>
                    </Link>
                    {/* Developers nav item (locked, visible) */}
                    <div
                        key="Developers"
                        className={clsx(styles.navLink, styles.lockedNavLink)}
                        title="Developer tools are locked until v2"
                        style={{ opacity: 0.5, cursor: "not-allowed" }}
                    >
                        <Code2 size={18} />
                        <span className={styles.navText}>Developers</span>
                        <span className={styles.comingSoonLabel} style={{ marginLeft: 8 }}>Coming in v2.0</span>
                    </div>

                    {/* Pinned Items */}
                    {pinnedHistory.length > 0 && (
                        <div className={styles.pinnedSection}>
                            <div className={styles.pinnedHeader}>Pinned</div>
                            {pinnedHistory.map(item => (
                                <div key={item.id} className={styles.pinnedItem} title={isCollapsed ? item.title : undefined}>
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
                            <span className={styles.btnText}>Sign Out</span>
                        </button>
                    ) : (
                        <div className={styles.authButtons}>
                            <Link
                                href="/login"
                                className={styles.signInBtn}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <LogIn size={16} />
                                <span className={styles.btnText}>Sign In</span>
                            </Link>
                            <Link
                                href="/login?mode=signup"
                                className={styles.earlyAccessBtn}
                                onClick={() => setIsMobileOpen(false)}
                            >
                                <UserPlus size={16} />
                                <span className={styles.btnText}>Sign Up</span>
                            </Link>
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
            </aside >

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSaveProfile={(name) => setProfileName(name)}
                currentName={profileName}
                userEmail={user?.email}
            />

            {/* Onboarding modal removed */}
        </>
    );
}
