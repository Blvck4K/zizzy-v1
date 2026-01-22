"use client";

import { Send, Plus, Bot, User, GraduationCap, Code2, Sparkles, Wind, Compass } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { generateResponseStream, UserMode, ChatMessage } from "@/services/aiService"; // Remove AIProvider import if unused
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./ChatInterface.module.css";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";
import Image from "next/image";

const FormatMessage = ({ content }: { content: string }) => {
    // Basic Markdown formatting
    const parts = content.split(/(```[\s\S]*?```|\*\*.*?\*\*|`.*?`)/g);

    return (
        <span className={styles.formattedText}>
            {parts.map((part, index) => {
                if (part.startsWith("```")) {
                    // Code block
                    const codeContent = part.replace(/```\w*\n?|```/g, "");
                    const language = part.match(/```(\w*)/)?.[1] || "";
                    return (
                        <pre key={index} className={styles.codeBlock}>
                            {language && <div className={styles.codeLang}>{language}</div>}
                            <code>{codeContent}</code>
                        </pre>
                    );
                }
                if (part.startsWith("**") && part.endsWith("**")) {
                    // Bold
                    return <strong key={index}>{part.slice(2, -2)}</strong>;
                }
                if (part.startsWith("`") && part.endsWith("`")) {
                    // Inline code
                    return <code key={index} className={styles.inlineCode}>{part.slice(1, -1)}</code>;
                }
                // Line breaks
                return part.split('\n').map((line, i) => (
                    <span key={`${index}-${i}`}>
                        {line}
                        {i < part.split('\n').length - 1 && <br />}
                    </span>
                ));
            })}
        </span>
    );
};

export default function ChatInterface() {
    // Context State
    const {
        profileName,
        preferredProvider,
        setPreferredProvider,
        messages, // From Context
        currentChatId,
        createNewChat,
        sendMessage,
        clearCurrentChat
    } = useUser();

    // Local UI State
    const [input, setInput] = useState("");
    const [mode, setMode] = useState<UserMode>('explorer');
    const [isTyping, setIsTyping] = useState(false);
    const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Derived state for UI mode (Zero State logic)
    const isChatActive = currentChatId !== null || messages.length > 0;

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async (text: string = input) => {
        if (!text.trim()) return;

        // AUTH CHECK
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        setInput("");
        setIsTyping(true); // Keep strictly for bottom scroll triggers if needed, or remove completely if stream update handles it.
        // Actually, let's keep it true until stream ends to show "Stop Generating" or similar if we added that,
        // but for now it's fine.

        let activeId = currentChatId;

        try {
            // 1. Send User Message
            if (!activeId) {
                // Create new chat if none exists
                const newId = await createNewChat(text);
                activeId = newId;
            } else {
                await sendMessage(text, 'user');
            }

            // 2. Prepare for Streaming
            // We need to add a placeholder message for the assistant to the UI immediately
            // But `sendMessage` updates the context state...
            // So we'll call sendMessage with empty string first?
            // Or better, we manually update the local messages state if we want super-fast feedback, 
            // but `sendMessage` does optimistic update in Context.

            // Let's rely on sendMessage to add the empty bubble, then update it?
            // Context doesn't expose a method to update a specific message *content* effectively without re-fetching or complex logic,
            // UNLESS we just append chunks to the last message in the context?

            // Wait, `sendMessage` in context adds a NEW message. 
            // We can't use `sendMessage` for every chunk.

            // WE NEED TO MODIFY CONTEXT OR HANDLE STREAMING LOCALLY BEFORE SAVING FINAL.
            // Since modifying context is hard without exposing a new method, let's use a local trick:
            // We will NOT call `sendMessage` for the assistant yet.
            // We will manually append a temporary message to the `messages` array for rendering ONLY.
            // BUT `messages` comes from useUser context. We can't mutate it directly.

            // Use a local state for "streamingContent" and render it conditionally?
            // YES.

        } catch (error) {
            console.error(error);
        }

        // 3. Generate & Stream AI Response
        const historyForAI = [...messages, { role: 'user' as const, content: text }];
        let accumulatedResponse = "";

        try {
            // Import generateResponseStream (Need to update imports first, but I will assume I can do it here or let the build fail/fix?)
            // I'll update the imports in a separate block if needed, but here:

            // START STREAMING
            const stream = generateResponseStream(text, mode, preferredProvider, historyForAI, profileName);

            for await (const chunk of stream) {
                accumulatedResponse += chunk;
                // Force update UI?
                // We need a way to show this.
                // OPTION: Add a special "streaming" message to the list?
                // Since we can't easily touch context messages, let's add a local state `streamingMessage: string | null`.
                setStreamingMessage(accumulatedResponse);
            }

            // Stream finished. Now save to DB and Context.
            if (activeId) {
                await sendMessage(accumulatedResponse, 'assistant', activeId);
            }

            setStreamingMessage(null); // Clear local streaming buffer since it's now in main messages

        } catch (error) {
            console.error("Stream Error", error);
            setStreamingMessage(null);
        } finally {
            setIsTyping(false);
        }
    };

    const suggestions = [
        { icon: <Code2 size={16} />, label: "Create React Component" },
        { icon: <GraduationCap size={16} />, label: "Explain Concept" },
        { icon: <Sparkles size={16} />, label: "Optimize Code" },
        { icon: <Wind size={16} />, label: "Project Structure" },
    ];

    return (
        <div className={styles.container}>
            {/* Header - Always visible but transparent in zero state? Image 0 shows header. */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    {/* Only show title in Active state or always? Image 0 shows "Ask Zizzy" in input, header looks minimal or same.
                       Let's keep the controls. */}
                    <span className={styles.badge}>v1.0 Preview</span>

                    {/* Mode Toggle */}
                    <div className={styles.toggleContainer}>
                        <button
                            onClick={() => setMode('explorer')}
                            className={clsx(styles.toggleBtn, mode === 'explorer' && styles.toggleBtnActive)}
                            title="Explorer Mode"
                        >
                            <Compass size={14} />
                            Explorer
                        </button>
                        <button
                            onClick={() => setMode('developer')}
                            className={clsx(styles.toggleBtn, mode === 'developer' && styles.toggleBtnActive)}
                            title="Developer Mode"
                        >
                            <Code2 size={14} />
                            Developer
                        </button>
                    </div>
                </div>

                {/* Model Toggle */}
                <div className={styles.toggleContainer}>
                    <button
                        onClick={() => setPreferredProvider('gemini')}
                        className={clsx(styles.toggleBtn, preferredProvider === 'gemini' && styles.toggleBtnActive)}
                        title="Use Gemini"
                    >
                        <Sparkles size={14} />
                        Gemini
                    </button>
                    <button
                        onClick={() => setPreferredProvider('mistral')}
                        className={clsx(styles.toggleBtn, preferredProvider === 'mistral' && styles.toggleBtnActive)}
                        title="Use Mistral"
                    >
                        <Wind size={14} />
                        Mistral
                    </button>
                </div>
            </header>

            <div className={styles.contentWrapper}>
                {!isChatActive ? (
                    /* ZERO STATE */
                    <div className={styles.zeroStateContainer}>
                        <div className={styles.greetingHeader}>
                            <div className={styles.logoWrapper}>
                                <Image src="/logo.png" alt="Zizzy" width={48} height={48} className={styles.zeroLogo} />
                            </div>
                            <h1 className={styles.greetingTitle}>
                                Hi <span className={styles.highlightName}>{profileName}</span>
                            </h1>
                        </div>
                        <h2 className={styles.greetingSubtitle}>Where should we start?</h2>

                        <div className={styles.zeroInputWrapper}>
                            <div className={styles.inputContainer}>
                                <input
                                    type="text"
                                    className={styles.zeroInput}
                                    placeholder="Ask Zizzy..."
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    autoFocus
                                />
                                <div className={styles.inputIcons}>
                                    <button className={styles.iconBtn}><Code2 size={20} /></button>
                                    <button className={styles.iconBtn}><Sparkles size={20} /></button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.suggestions}>
                            <p className={styles.suggestionsLabel}>+ Tools</p>
                            <div className={styles.suggestionChips}>
                                {suggestions.map((s) => (
                                    <button
                                        key={s.label}
                                        className={styles.chip}
                                        onClick={() => handleSend(s.label)}
                                    >
                                        {s.icon}
                                        <span>{s.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    /* ACTIVE STATE */
                    <>
                        <div className={styles.messagesArea}>
                            {messages.map((msg, i) => (
                                <div key={i} className={clsx(styles.messageRow, msg.role === 'user' && styles.messageRowUser)}>
                                    <div className={clsx(styles.avatar, msg.role === 'assistant' ? styles.avatarAssistant : styles.avatarUser)}>
                                        {msg.role === 'assistant' ? (
                                            <Image src="/logo.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} />
                                        ) : (
                                            <User size={16} />
                                        )}
                                    </div>

                                    <div className={clsx(styles.messageContent, msg.role === 'user' && styles.messageContentUser)}>
                                        <p className={styles.senderName}>
                                            {msg.role === 'assistant' ? 'Zizzy' : profileName}
                                        </p>
                                        <div className={clsx(styles.bubble, msg.role === 'assistant' ? styles.bubbleAssistant : styles.bubbleUser)}>
                                            {msg.role === 'assistant' ? <FormatMessage content={msg.content} /> : msg.content}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {streamingMessage && (
                                <div className={clsx(styles.messageRow, styles.messageRowAssistant)}>
                                    <div className={clsx(styles.avatar, styles.avatarAssistant)}>
                                        <Image src="/logo.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} />
                                    </div>
                                    <div className={styles.messageContent}>
                                        <p className={styles.senderName}>Zizzy</p>
                                        <div className={clsx(styles.bubble, styles.bubbleAssistant)}>
                                            <FormatMessage content={streamingMessage} />
                                        </div>
                                    </div>
                                </div>
                            )}
                            {/* Removed old Thinking Indicator as requested */}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Input Area */}
                        <div className={styles.inputArea}>
                            <div className={styles.inputWrapper}>
                                <button
                                    className={styles.iconBtn}
                                    onClick={() => clearCurrentChat()}
                                    title="New Chat"
                                >
                                    <Plus size={20} />
                                </button>

                                <input
                                    type="text"
                                    className={styles.inputField}
                                    placeholder={mode === 'explorer' ? "Ask a question to explore..." : "Ask a technical question..."}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                />

                                <button onClick={() => handleSend()} className={styles.sendBtn}>
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className={styles.disclaimer}>
                                Automated website building & management — coming soon 🚀
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
