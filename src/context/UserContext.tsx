"use client";

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from "@/lib/supabase";
import { ChatMessage } from "@/services/aiService";

export type Theme = 'light' | 'dark' | 'system';

export interface ChatSession {
    id: string;
    title: string;
    created_at: string;
    pinned: boolean;
}

interface UserContextType {
    // Profile
    profileName: string;
    setProfileName: (name: string) => void;
    profileImage: string | null;
    setProfileImage: (image: string | null) => void;

    // Theme
    theme: Theme;
    setTheme: (theme: Theme) => void;

    // AI Settings
    preferredProvider: 'gemini' | 'mistral';
    setPreferredProvider: (provider: 'gemini' | 'mistral') => void;

    // Explorer Intent
    explorerIntent: 'knowledge' | 'problem' | 'idea';
    setExplorerIntent: (intent: 'knowledge' | 'problem' | 'idea') => void;

    // Chat History & State
    history: ChatSession[];
    currentChatId: string | null;
    messages: ChatMessage[];
    isLoadingHistory: boolean;

    // Actions
    createNewChat: (firstMessageContent: string) => Promise<string | null>;
    sendMessage: (content: string, role: 'user' | 'assistant', chatId?: string) => Promise<void>;
    selectChat: (chatId: string | null) => void;
    deleteChat: (chatId: string) => Promise<void>;
    renameChat: (chatId: string, newTitle: string) => Promise<void>;
    togglePinChat: (chatId: string) => Promise<void>;
    clearCurrentChat: () => void;

}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
    // Lazy Initialization to prevent overwrite on mount
    const [profileName, setProfileName] = useState("Friend");
    const [profileImage, setProfileImage] = useState<string | null>(null);
    const [theme, setTheme] = useState<Theme>('system');
    const [preferredProvider, setPreferredProvider] = useState<'gemini' | 'mistral'>('gemini');
    const [explorerIntent, setExplorerIntent] = useState<'knowledge' | 'problem' | 'idea'>('knowledge');

    const [history, setHistory] = useState<ChatSession[]>([]);
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [mounted, setMounted] = useState(false);


    // Initial Load & Auth Listener
    useEffect(() => {
        setMounted(true);

        // Load DEVICE Settings from LocalStorage (Theme & Provider only)
        const storedTheme = localStorage.getItem("zizzy_theme") as Theme;
        if (storedTheme) setTheme(storedTheme);

        const storedProvider = localStorage.getItem("zizzy_provider") as 'gemini' | 'mistral';
        if (storedProvider) setPreferredProvider(storedProvider);

        const storedIntent = localStorage.getItem("zizzy_intent") as 'knowledge' | 'problem' | 'idea';
        if (storedIntent) setExplorerIntent(storedIntent);

        // Auth State Listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED_OR_USER_CHANGED' as any) {
                // Load User Specific Data
                if (session?.user) {
                    loadHistory();
                    // Load Profile from Metadata
                    const { user_metadata } = session.user;
                    if (user_metadata?.full_name) setProfileName(user_metadata.full_name);
                    if (user_metadata?.avatar_url) setProfileImage(user_metadata.avatar_url);
                }
            } else if (event === 'SIGNED_OUT') {
                setHistory([]);
                setMessages([]);
                setCurrentChatId(null);
                setProfileName("Friend");
                setProfileImage(null);
            }
        });

        // Initial Load
        checkUser();

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            const { user_metadata } = session.user;
            if (user_metadata?.full_name) setProfileName(user_metadata.full_name);
            if (user_metadata?.avatar_url) setProfileImage(user_metadata.avatar_url);
            loadHistory();
        }
    };

    // ...existing code...

    // Update Profile Name Wrapper
    const updateProfileName = async (name: string) => {
        setProfileName(name);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.auth.updateUser({
                data: { full_name: name }
            });
        }
    };

    // Update Profile Image Wrapper (Called after upload)
    const updateProfileImage = async (url: string | null) => {
        setProfileImage(url);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            await supabase.auth.updateUser({
                data: { avatar_url: url }
            });
        }
    };

    // Load History from Supabase
    const loadHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setHistory([]); // Ensure empty if no user
                setIsLoadingHistory(false);
                return;
            }

            const { data, error } = await supabase
                .from('chats')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setHistory(data || []);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    // Load Messages when Chat Changes
    useEffect(() => {
        const loadMessages = async () => {
            if (!currentChatId) {
                setMessages([]);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chat_id', currentChatId)
                    .order('created_at', { ascending: true });

                if (error) throw error;

                // Mapped correctly
                setMessages(data.map(m => ({ role: m.role, content: m.content })));
            } catch (error) {
                console.error('Error loading messages:', error);
            }
        };

        if (currentChatId) {
            loadMessages();
        } else {
            setMessages([]);
        }
    }, [currentChatId]);


    // Persistence for Settings (Device Only)
    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("zizzy_theme", theme);
    }, [theme, mounted]);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("zizzy_provider", preferredProvider);
    }, [preferredProvider, mounted]);

    useEffect(() => {
        if (!mounted) return;
        localStorage.setItem("zizzy_intent", explorerIntent);
    }, [explorerIntent, mounted]);


    // Actions
    const createNewChat = async (firstMessageContent: string): Promise<string | null> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            const title = firstMessageContent.slice(0, 30) + (firstMessageContent.length > 30 ? "..." : "");

            // 1. Create Chat
            const { data: chatData, error: chatError } = await supabase
                .from('chats')
                .insert({ user_id: user.id, title })
                .select()
                .single();

            if (chatError) throw chatError;

            // 2. Add to local history state immediately
            setHistory(prev => [chatData, ...prev]);

            // 3. Set Active
            setCurrentChatId(chatData.id);

            // 4. Save first message
            await sendMessageToDb(chatData.id, firstMessageContent, 'user');

            return chatData.id;
        } catch (error) {
            console.error('Error creating chat:', error);
            return null;
        }
    };

    const sendMessage = async (content: string, role: 'user' | 'assistant', chatId?: string) => {
        // Optimistic UI update
        setMessages(prev => [...prev, { role, content }]);

        const targetId = chatId || currentChatId;
        if (targetId) {
            await sendMessageToDb(targetId, content, role);
        }
    };

    const sendMessageToDb = async (chatId: string, content: string, role: string) => {
        try {
            await supabase.from('messages').insert({
                chat_id: chatId,
                role,
                content
            });
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const selectChat = (chatId: string | null) => {
        setCurrentChatId(chatId);
    };

    const clearCurrentChat = () => {
        setCurrentChatId(null);
        setMessages([]);
    };

    const deleteChat = async (chatId: string) => {
        const { error } = await supabase.from('chats').delete().eq('id', chatId);
        if (!error) {
            setHistory(prev => prev.filter(c => c.id !== chatId));
            if (currentChatId === chatId) {
                clearCurrentChat();
            }
        }
    };

    const renameChat = async (chatId: string, newTitle: string) => {
        const { error } = await supabase
            .from('chats')
            .update({ title: newTitle })
            .eq('id', chatId);

        if (!error) {
            setHistory(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
        }
    };

    const togglePinChat = async (chatId: string) => {
        const chat = history.find(c => c.id === chatId);
        if (!chat) return;

        const { error } = await supabase
            .from('chats')
            .update({ pinned: !chat.pinned })
            .eq('id', chatId);

        if (!error) {
            setHistory(prev => prev.map(c => c.id === chatId ? { ...c, pinned: !c.pinned } : c));
        }
    };

    // Theme Logic
    useEffect(() => {
        const root = window.document.documentElement;
        if (!mounted) return; // Wait for mount

        const applyTheme = () => {
            const isDark =
                theme === 'dark' ||
                (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

            if (isDark) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => {
            if (theme === 'system') applyTheme();
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme, mounted]);
    return (
        <UserContext.Provider value={{
            profileName,
            setProfileName: updateProfileName,
            profileImage,
            setProfileImage: updateProfileImage,
            theme,
            setTheme,
            preferredProvider,
            setPreferredProvider,
            explorerIntent,
            setExplorerIntent,
            history,
            currentChatId,
            messages,
            isLoadingHistory,
            createNewChat,
            sendMessage,
            selectChat,
            deleteChat,
            renameChat,
            togglePinChat,
            clearCurrentChat,
            // ...existing code...
            user: null // Will need to update type def if we want to expose user object
        } as any}>
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
