"use client";

import { useState, useEffect } from "react";
import { X, User, Palette, Key, Save, Camera } from "lucide-react";
import styles from "./SettingsModal.module.css";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";
import { supabase } from "@/lib/supabase";

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveProfile: (name: string) => void;
    currentName: string;
    userEmail?: string;
}

type Tab = 'profile' | 'theme' | 'api';

export default function SettingsModal({ isOpen, onClose, onSaveProfile, currentName, userEmail }: SettingsModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('profile');
    const {
        profileName, setProfileName,
        profileImage, setProfileImage,
        theme, setTheme
    } = useUser();

    // Local state for edits
    const [localName, setLocalName] = useState(profileName);
    const [uploadError, setUploadError] = useState<string | null>(null);

    useEffect(() => {
        setLocalName(profileName);
    }, [profileName, isOpen]);

    const handleSave = () => {
        setProfileName(localName);
        onSaveProfile(localName); // Keep prop for backward compatibility or parent updates
        onClose();
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadError(null);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                setUploadError("Failed to upload image. Ensure 'avatars' bucket exists and is public.");
                return;
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            // 3. Update Profile via Context (which updates Auth Metadata)
            setProfileImage(publicUrl);

        } catch (error) {
            console.error('Error handling image upload:', error);
            setUploadError("An unexpected error occurred.");
        }
    };

    if (!isOpen) return null;

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Settings</h2>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.sidebar}>
                        <button
                            className={clsx(styles.tabBtn, activeTab === 'profile' && styles.activeTab)}
                            onClick={() => setActiveTab('profile')}
                        >
                            <User size={16} />
                            Profile
                        </button>
                        <button
                            className={clsx(styles.tabBtn, activeTab === 'theme' && styles.activeTab)}
                            onClick={() => setActiveTab('theme')}
                        >
                            <Palette size={16} />
                            Theme
                        </button>
                        <button
                            className={clsx(styles.tabBtn, activeTab === 'api' && styles.activeTab)}
                            onClick={() => setActiveTab('api')}
                        >
                            <Key size={16} />
                            API
                        </button>
                    </div>

                    <div className={styles.panel}>
                        {activeTab === 'profile' && (
                            <>
                                <div className={styles.profileImageContainer}>
                                    <div className={styles.imagePreview}>
                                        {profileImage ? (
                                            <img src={profileImage} alt="Profile" className={styles.previewImg} />
                                        ) : (
                                            <User size={32} />
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                        <label className={styles.uploadBtn}>
                                            <Camera size={16} />
                                            Upload Photo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className={styles.hiddenInput}
                                            />
                                        </label>
                                        {uploadError && (
                                            <span style={{ color: 'red', fontSize: '0.75rem' }}>{uploadError}</span>
                                        )}
                                    </div>
                                </div>

                                <div className={styles.group}>
                                    <label className={styles.label}>Display Name</label>
                                    <input
                                        type="text"
                                        value={localName}
                                        onChange={(e) => setLocalName(e.target.value)}
                                        className={styles.input}
                                        placeholder="How should Zizzy call you?"
                                    />
                                </div>

                                {userEmail && (
                                    <div className={styles.group}>
                                        <label className={styles.label}>Email</label>
                                        <input
                                            type="text"
                                            value={userEmail}
                                            disabled
                                            className={styles.input}
                                            style={{ opacity: 0.7, cursor: 'not-allowed' }}
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {activeTab === 'theme' && (
                            <div className={styles.group}>
                                <label className={styles.label}>Appearance</label>
                                <div className={styles.themeOptions}>
                                    <button
                                        className={clsx(styles.themeOption, theme === 'light' && styles.activeTheme)}
                                        onClick={() => setTheme('light')}
                                    >
                                        Light
                                    </button>
                                    <button
                                        className={clsx(styles.themeOption, theme === 'dark' && styles.activeTheme)}
                                        onClick={() => setTheme('dark')}
                                    >
                                        Dark
                                    </button>
                                    <button
                                        className={clsx(styles.themeOption, theme === 'system' && styles.activeTheme)}
                                        onClick={() => setTheme('system')}
                                    >
                                        System
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTab === 'api' && (
                            <div className={styles.group}>
                                <label className={styles.label}>Default API Provider</label>
                                <select className={styles.select}>
                                    <option value="gemini">Google Gemini</option>
                                    <option value="mistral">Mistral AI</option>
                                </select>
                            </div>
                        )}
                    </div>
                </div>

                <div className={styles.footer}>
                    <button onClick={handleSave} className={styles.saveBtn}>
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}
