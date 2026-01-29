"use client";

import { Send, Plus, Bot, User, GraduationCap, Code2, Sparkles, Wind, Compass, Square, Pause, Copy, Check, ExternalLink, X, Image as ImageIcon, Paperclip, Bookmark, FileCode, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { generateResponseStream, UserMode, ChatMessage, AIImage } from "@/services/aiService"; // Remove AIProvider import if unused
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import styles from "./ChatInterface.module.css";
import clsx from "clsx";
import { useUser } from "@/context/UserContext";
import Image from "next/image";


interface Source {
    title: string;
    url: string;
    domain: string;
}

const FileCard = ({ fileName, content }: { fileName: string, content: string }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const isCode = ['js', 'ts', 'tsx', 'py', 'sql', 'json', 'css', 'html'].includes(ext);

    return (
        <div className={styles.fileCardWrapper}>
            <div className={styles.fileCardHeader} onClick={() => setIsExpanded(!isExpanded)}>
                <div className={styles.fileCardLeft}>
                    {isCode ? <FileCode size={18} className={styles.fileIcon} /> : <FileText size={18} className={styles.fileIcon} />}
                    <div className={styles.fileInfo}>
                        <span className={styles.fileName}>{fileName}</span>
                        <span className={styles.fileLang}>{ext.toUpperCase()}</span>
                    </div>
                </div>
                <button className={styles.expandBtn}>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
            </div>
            {isExpanded && (
                <div className={styles.fileCardContent}>
                    <pre><code>{content}</code></pre>
                </div>
            )}
        </div>
    );
};

const copyToClipboard = async (text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    } else {
        // Fallback
        try {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        } catch (err) {
            console.error('Fallback copy failed: ', err);
        }
    }
};

const CodeBlock = ({ language, code }: { language: string, code: string }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        await copyToClipboard(code);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className={styles.codeBlockWrapper}>
            <div className={styles.codeHeader}>
                <span className={styles.codeLang}>{language || 'code'}</span>
                <button
                    className={styles.copyCodeBtn}
                    onClick={handleCopy}
                    title={isCopied ? "Copied" : "Copy code"}
                >
                    {isCopied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
                </button>
            </div>
            <pre className={styles.codeBlock}>
                <code>{code}</code>
            </pre>
        </div>
    );
};

const FormattedMessage = ({ content, role, onMarkDecision, canMarkDecision }: { content: string, role: 'user' | 'assistant', onMarkDecision?: (text: string) => void, canMarkDecision?: boolean }) => {
    const [isResponseCopied, setIsResponseCopied] = useState(false);

    // ... source parsing ...
    const sourceMatch = content.match(/<<SOURCES: (.*?)>>/);
    let sources: Source[] = [];
    let cleanContent = content;

    if (sourceMatch) {
        try {
            sources = JSON.parse(sourceMatch[1]);
            cleanContent = content.replace(sourceMatch[0], '').trim();
        } catch (e) {
            console.error("Failed to parse sources", e);
        }
    }

    // Split by File Patterns first: [File: name]\n```content```
    const fileParts = cleanContent.split(/(\[File: .*?\]\s*```[\s\S]*?```)/g);

    const handleMainCopy = async () => {
        await copyToClipboard(cleanContent);
        setIsResponseCopied(true);
        setTimeout(() => setIsResponseCopied(false), 2000);
    };

    return (
        <div className={styles.messageContainer}>
            {fileParts.map((part, pIdx) => {
                const fileMatch = part.match(/\[File: (.*?)\]\s*```([\s\S]*?)```/);
                if (fileMatch) {
                    return <FileCard key={pIdx} fileName={fileMatch[1]} content={fileMatch[2]} />;
                }

                // Normal Markdown Processing for non-file parts
                const codeParts = part.split(/(```[\s\S]*?```)/g);
                return (
                    <div key={pIdx} className={styles.formattedText}>
                        {codeParts.map((subPart, index) => {
                            if (subPart.startsWith("```")) {
                                const codeContent = subPart.replace(/```\w*\n?|```/g, "");
                                const language = subPart.match(/```(\w*)/)?.[1] || "";
                                return <CodeBlock key={index} language={language} code={codeContent} />;
                            }

                            return (
                                <div key={index}>
                                    {subPart.split('\n').map((line, lineIdx) => {
                                        if (!line.trim()) return <br key={lineIdx} />;
                                        if (line.startsWith('# ')) return <h3 key={lineIdx} className={styles.markdownH1}>{line.slice(2).replace(/\*\*/g, '')}</h3>;
                                        if (line.startsWith('## ')) return <strong key={lineIdx} className={styles.markdownH2}>{line.slice(3).replace(/\*\*/g, '')}</strong>;
                                        if (line.startsWith('### ')) return <strong key={lineIdx} className={styles.markdownH3}>{line.slice(4).replace(/\*\*/g, '')}</strong>;
                                        if (line.startsWith('- ') || line.startsWith('* ')) {
                                            return (
                                                <div key={lineIdx} style={{ display: 'flex', gap: '8px', marginLeft: '8px' }}>
                                                    <span>•</span>
                                                    <span>
                                                        {line.slice(2).split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|!\[.*?\]\(.*?\))/g).map((token, tIdx) => {
                                                            if (token.startsWith('`') && token.endsWith('`')) return <code key={tIdx} className={styles.inlineCode}>{token.slice(1, -1)}</code>;
                                                            if (token.startsWith('**') && token.endsWith('**')) return <strong key={tIdx}>{token.slice(2, -2)}</strong>;
                                                            if (token.startsWith('*') && token.endsWith('*')) return <em key={tIdx}>{token.slice(1, -1)}</em>;
                                                            return <span key={tIdx}>{token}</span>;
                                                        })}
                                                    </span>
                                                </div>
                                            );
                                        }

                                        const tokens = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|!\[.*?\]\(.*?\))/g);

                                        return (
                                            <p key={lineIdx} className={styles.textLine} style={{ margin: '4px 0', minHeight: '1em' }}>
                                                {tokens.map((token, tIdx) => {
                                                    if (token.startsWith('`') && token.endsWith('`')) return <code key={tIdx} className={styles.inlineCode}>{token.slice(1, -1)}</code>;
                                                    if (token.startsWith('**') && token.endsWith('**')) {
                                                        const content = token.slice(2, -2);
                                                        return <strong key={tIdx}>{content}</strong>;
                                                    }
                                                    if (token.startsWith('*') && token.endsWith('*')) {
                                                        const content = token.slice(1, -1);
                                                        return <em key={tIdx}>{content}</em>;
                                                    }
                                                    if (token.startsWith('![') && token.endsWith(')')) {
                                                        const match = token.match(/!\[(.*?)\]\((.*?)\)/);
                                                        if (match) return <img key={tIdx} src={match[2]} alt={match[1]} className={styles.chatImage} style={{ maxWidth: '100%', borderRadius: '8px' }} />;
                                                    }
                                                    return <span key={tIdx}>{token}</span>;
                                                })}
                                            </p>
                                        );
                                    })}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            {role === 'assistant' && (
                <div className={styles.messageActions}>
                    <button onClick={handleMainCopy} className={styles.copyButton} title="Copy response">
                        {isResponseCopied ? <Check size={14} strokeWidth={2.5} /> : <Copy size={14} />}
                        <span>{isResponseCopied ? "Copied" : "Copy"}</span>
                    </button>
                    {canMarkDecision && onMarkDecision && (
                        <button
                            onClick={() => onMarkDecision(cleanContent)}
                            className={styles.copyButton}
                            title="Mark as Decision"
                            style={{ marginLeft: '8px' }}
                        >
                            <Bookmark size={14} />
                            <span>Mark as Decision</span>
                        </button>
                    )}
                </div>
            )}

            {sources.length > 0 && (
                <div className={styles.sourcesContainer}>
                    {sources.map((source, idx) => (
                        <a key={idx} href={source.url} target="_blank" rel="noopener noreferrer" className={styles.sourceChip} title={source.title}>
                            <img src={`https://www.google.com/s2/favicons?domain=${source.domain}`} alt="" className={styles.sourceFavicon} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                            <span className={styles.sourceTitle}>{source.domain}</span>
                            <ExternalLink size={10} style={{ opacity: 0.5 }} />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};


interface ChatInterfaceProps {
    initialMode?: UserMode;
    initialContext?: string;
    initialFiles?: { file: File, content: string }[];
    initialProvider?: 'gemini' | 'mistral';
}

// Persistent onboarding flag
function getFirstSignInFlag() {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('zizzy_first_signin') !== 'false';
}
function setFirstSignInFlag(val: boolean) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('zizzy_first_signin', val ? 'true' : 'false');
}

export default function ChatInterface({ initialMode = 'explorer', initialContext, initialFiles, initialProvider }: ChatInterfaceProps) {

    // Context State
    const {
        profileName,
        profileImage,
        preferredProvider,
        setPreferredProvider,
        explorerIntent, // Get intent from context
        messages, // From Context
        currentChatId,
        createNewChat,
        sendMessage,
        clearCurrentChat
    } = useUser();

    // Local UI State
    const [input, setInput] = useState("");
    // Developer mode is locked for v1
    const [mode, setMode] = useState<UserMode>('explorer');
    // Onboarding state (client-only to avoid hydration error)
    const [isFirstSignIn, setIsFirstSignIn] = useState(false);
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setIsFirstSignIn(getFirstSignInFlag());
        }
    }, []);

    // Initial Provider Override
    useEffect(() => {
        if (initialProvider) {
            setPreferredProvider(initialProvider);
        }
    }, [initialProvider]);

    const [isTyping, setIsTyping] = useState(false);
    // Auto-fill from URL params
    useEffect(() => {
        // Simple search param check (Note: Next.js 13+ app directory often uses useSearchParams, 
        // but window location check is robust for simple client comps if useSearchParams not avail/configured)
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const promptParam = params.get('prompt');
            if (promptParam) {
                setInput(decodeURIComponent(promptParam));
                // Optional: clear param so it doesn't stick
                window.history.replaceState({}, '', '/');
            }
        }
    }, []);

    const [streamingMessage, setStreamingMessage] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    // File Handling State
    const [selectedFiles, setSelectedFiles] = useState<{ file: File, preview: string, type: string }[]>([]);

    // Initialize files from props
    useEffect(() => {
        if (initialFiles && initialFiles.length > 0) {
            // Convert to internal format
            const processed = initialFiles.map(f => ({
                file: f.file,
                preview: "", // No preview for text files usually, or generate a dummy one
                type: f.file.type || 'text/plain'
            }));
            setSelectedFiles(processed);
        }
    }, [initialFiles]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const abortControllerRef = useRef<AbortController | null>(null);

    // Derived state for UI mode (Zero State logic)
    const isChatActive = currentChatId !== null || messages.length > 0;

    // Handle Initial Context (e.g. from Developer Drop Zone)
    useEffect(() => {
        if (initialContext && !currentChatId && messages.length === 0) {
            // Tiny delay to ensure hydration/setup
            setTimeout(() => {
                // If we also have files, we want to send them together.
                // The handleSend reads `selectedFiles` state.
                // We must ensure selectedFiles is updated before handleSend runs.
                // Since hooks batch, we might need a small delay or put this in the dependency of selectedFiles if meaningful.
                // However, initialFiles logic runs on mount.
                // Let's rely on the timeout.
                handleSend(initialContext);
            }, 200);
        }
    }, [initialContext]); // Run when initialContext is provided (usually mount)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, statusMessage, streamingMessage]);

    const handleStop = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
            setIsTyping(false);
            setStatusMessage(null);
        }
    };

    // File Handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            processFiles(Array.from(e.target.files));
        }
    };

    const processFiles = (files: File[]) => {
        files.forEach(file => {
            const reader = new FileReader();
            // Check if text based
            const isText = file.type.startsWith('text/') ||
                ['.js', '.ts', '.tsx', '.py', '.json', '.md', '.css', '.html'].some(ext => file.name.endsWith(ext));

            if (isText) {
                reader.onloadend = () => {
                    setSelectedFiles(prev => [...prev, {
                        file,
                        preview: reader.result as string, // Content of text file
                        type: file.type || 'text/plain'
                    }]);
                };
                reader.readAsText(file);
            } else {
                reader.onloadend = () => {
                    setSelectedFiles(prev => [...prev, {
                        file,
                        preview: reader.result as string, // Base64 for images
                        type: file.type
                    }]);
                };
                reader.readAsDataURL(file);
            }
        });
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files) {
            processFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSend = async (text: string = input) => {
        if (isTyping) {
            handleStop();
            return;
        }

        if (!text.trim() && selectedFiles.length === 0) return;

        // AUTH CHECK
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login');
            return;
        }

        setInput("");
        setIsTyping(true);
        setStatusMessage(null);
        // End onboarding after first message
        if (isFirstSignIn) {
            setIsFirstSignIn(false);
            setFirstSignInFlag(false);
        }

        // Reset AbortController
        if (abortControllerRef.current) abortControllerRef.current.abort();
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        let activeId = currentChatId;

        // Prepare Message Content (incorporate images for display/storage)
        let fullContent = text;
        const aiImages: AIImage[] = [];

        if (selectedFiles.length > 0) {
            // Append images to content for markdown display using base64
            // And prepare AIImage objects
            selectedFiles.forEach(f => {
                if (f.type.startsWith('image/')) {
                    fullContent += `\n\n![${f.file.name}](${f.preview})`;
                    aiImages.push({
                        base64: f.preview.split(',')[1], // Remove "data:image/x;base64," prefix
                        mimeType: f.type
                    });
                } else if (!f.type.startsWith('image/')) {
                    // For files, we wrap them in a special tag pattern we detect for File Cards
                    // [File: name] followed by hidden or block code content
                    fullContent += `\n\n[File: ${f.file.name}]\n\`\`\`${f.file.name.split('.').pop() || 'text'}\n${f.preview}\n\`\`\``;
                }
            });
            // Clear files after preparing
            setSelectedFiles([]);
        }

        try {
            // 1. Send User Message
            if (!activeId) {
                // Create new chat if none exists
                const newId = await createNewChat(fullContent);
                activeId = newId;
            } else {
                await sendMessage(fullContent, 'user');
            }

        } catch (error) {
            console.error(error);
            setIsTyping(false); // Stop if initial send fails
            return;
        }

        // 3. Generate & Stream AI Response
        const historyForAI = [...messages, { role: 'user' as const, content: fullContent }];
        let accumulatedResponse = "";

        try {
            // Pass explorerIntent to the AI service
            const stream = generateResponseStream(
                text, // Use original text prompt, AI gets images separately
                mode,
                explorerIntent,
                preferredProvider,
                historyForAI, // History contains full content (with embedded images)
                profileName,
                (status) => setStatusMessage(status),
                abortController.signal,
                aiImages // Pass images to AI service
            );

            for await (const chunk of stream) {
                accumulatedResponse += chunk;
                setStreamingMessage(accumulatedResponse);
            }

            // If this is the first AI response after onboarding, append a gentle follow-up suggestion
            if (!messages.length && isFirstSignIn) {
                accumulatedResponse = accumulatedResponse.trim().replace(/([.!?])$/, '$1') + "\n\n_If you want to try something else, just ask or pick another prompt below!_";
            }

            // Stream finished. Now save to DB and Context.
            if (activeId && accumulatedResponse) {
                await sendMessage(accumulatedResponse, 'assistant', activeId);
            }

            setStreamingMessage(null); // Clear local streaming buffer since it's now in main messages

        } catch (error: any) {
            if (error.message === "Aborted") {
                // Handle cleanup if needed, but UI state should be handled by handleStop mostly
                // Or here if natural completion
            } else {
                console.error("Stream Error", error);
            }
            // If we have some response but error occurred, save partial?
            if (accumulatedResponse && activeId) {
                await sendMessage(accumulatedResponse, 'assistant', activeId);
            }
            setStreamingMessage(null);
        } finally {
            // Only turn off typing if not aborted manually (which already turns it off)
            // But doing it here is safe redundancy
            if (abortControllerRef.current === abortController) {
                setIsTyping(false);
                setStatusMessage(null);
                abortControllerRef.current = null;
            }
        }
    };



    // Helper for icons not in top import (adding ad-hoc or reusing)
    // We need to make sure we import BookOpen, BrainCircuit, Lightbulb if we use them.
    // Let's just use what's available or safe defaults to avoid errors.
    // Available: Send, Plus, Bot, User, GraduationCap, Code2, Sparkles, Wind, Compass, Square, Pause, Copy, ExternalLink, X, Image, Paperclip

    // Re-doing suggestions with safe icons
    // Grouped suggestions for Explorer mode
    const explorerSuggestions = [
        {
            group: "Explore",
            items: [
                { icon: <Compass size={16} />, label: "Explore a new topic" },
                { icon: <GraduationCap size={16} />, label: "Explain this concept" },
                { icon: <Sparkles size={16} />, label: "Fun trivia" },
            ]
        },
        {
            group: "Plan",
            items: [
                { icon: <Square size={16} />, label: "Help me plan my week" },
                { icon: <Wind size={16} />, label: "Create a study plan" },
                { icon: <Pause size={16} />, label: "Organize my ideas" },
            ]
        },
        {
            group: "Create",
            items: [
                { icon: <Sparkles size={16} />, label: "Brainstorm ideas" },
                { icon: <Paperclip size={16} />, label: "Improve this text" },
                { icon: <Plus size={16} />, label: "Write something new" },
            ]
        }
    ];

    const getPlaceholder = () => isFirstSignIn ? "What do you want to explore today?" : "Type your message...";

    return (
        <div className={styles.container}>
            {/* Hidden File Input */}
            <input
                type="file"
                multiple
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept="image/*,.txt,.pdf,.js,.ts,.tsx,.css,.html" // Add extensions as needed
            />

            {/* Header */}
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <span className={clsx(styles.badge, styles.hideOnMobile)}>v1.0 Preview</span>
                </div>

                {/* Model Toggle */}
                <div className={styles.toggleContainer}>
                    <button
                        onClick={() => setPreferredProvider('gemini')}
                        className={clsx(styles.toggleBtn, preferredProvider === 'gemini' && styles.toggleBtnActive)}
                        title="Use Gemini"
                    >
                        <Sparkles size={14} />
                        <span className={styles.hideOnMobile}>Gemini</span>
                    </button>
                    <button
                        onClick={() => setPreferredProvider('mistral')}
                        className={clsx(styles.toggleBtn, preferredProvider === 'mistral' && styles.toggleBtnActive)}
                        title="Use Mistral"
                    >
                        <Wind size={14} />
                        <span className={styles.hideOnMobile}>Mistral</span>
                    </button>
                </div>
            </header>

            <div className={styles.contentWrapper}>
                {!isChatActive ? (
                    /* ZERO STATE */
                    <div className={styles.zeroStateContainer}>
                        <div className={styles.greetingHeader}>
                            <div className={styles.logoWrapper}>
                                <Image src="/logo.png" alt="Zizzy" width={48} height={48} className={`${styles.zeroLogo} ${styles.logoDark}`} />
                                <Image src="/zizzy-light.png" alt="Zizzy" width={48} height={48} className={`${styles.zeroLogo} ${styles.logoLight}`} />
                            </div>
                            <h1 className={styles.greetingTitle}>
                                Hi <span className={styles.highlightName}>{profileName}</span> 👋
                            </h1>
                        </div>
                        {isFirstSignIn && (
                            <div className={styles.onboardPurpose}>
                                I can help you explore ideas, plan tasks, and understand topics clearly.
                            </div>
                        )}
                        <h2 className={styles.greetingSubtitle}>
                            {mode === 'developer'
                                ? "Zizzy’s Developer tools are currently locked and will be available in a future release. Right now, I’m here to help you explore ideas, plan, and learn."
                                : explorerIntent === 'knowledge' ? "Let's learn something new. 📚"
                                    : explorerIntent === 'problem' ? "Let's solve a problem. 🧩"
                                        : "Let's create something. ✨"
                            }
                        </h2>

                        <div className={styles.zeroInputWrapper}>
                            <div
                                className={styles.inputContainer}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {/* File Previews for Zero State */}
                                {selectedFiles.length > 0 && (
                                    <div className={styles.filePreviewRow} style={{ padding: '8px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', background: '#333', borderRadius: '6px', padding: '4px 8px' }}>
                                                {file.type.startsWith('image/') ?
                                                    <img src={file.preview} alt="preview" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '4px', marginRight: '6px' }} />
                                                    : <Paperclip size={16} style={{ marginRight: '6px' }} />
                                                }
                                                <span style={{ fontSize: '12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file.name}</span>
                                                <button onClick={() => removeFile(i)} style={{ marginLeft: '6px', cursor: 'pointer', border: 'none', background: 'transparent', color: '#fff' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className={styles.inputTopRow}>
                                    <input
                                        type="text"
                                        className={styles.zeroInput}
                                        placeholder={getPlaceholder()}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        autoFocus
                                    />
                                </div>
                                {isFirstSignIn && (
                                    <div className={styles.inputHelper}>
                                        Ask a question or pick a prompt below to get started.
                                    </div>
                                )}
                                <div className={styles.inputBottomRow}>
                                    <button onClick={triggerFileInput} className={styles.attachBtn} title="Import (Images, Files)">
                                        <Plus size={20} />
                                    </button>
                                    <button
                                        onClick={() => handleSend()}
                                        className={styles.zeroSendBtn}
                                        disabled={!input.trim() && selectedFiles.length === 0}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className={styles.suggestions}>
                            {explorerSuggestions.map((group) => (
                                <div key={group.group} className={styles.suggestionGroup}>
                                    <p className={styles.suggestionsLabel}>{group.group}</p>
                                    <div className={styles.suggestionChips}>
                                        {group.items.map((s, idx) => (
                                            <button
                                                key={s.label}
                                                className={clsx(styles.chip, isFirstSignIn && group.group === 'Explore' && idx === 0 && styles.chipHighlight)}
                                                onClick={() => handleSend(s.label)}
                                            >
                                                {s.icon}
                                                <span>{s.label}</span>
                                                {isFirstSignIn && group.group === 'Explore' && idx === 0 && (
                                                    <span className={styles.startHereLabel}>Start here</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : ( // ... rest of the file (ACTIVE STATE) doesn't change much from previous tools but we need to ensure we close the replaced chunk correctly.
                    /* ACTIVE STATE */
                    <>
                        <div className={styles.messagesArea}>
                            {messages.map((msg, i) => (
                                <div key={i} className={clsx(styles.messageRow, msg.role === 'user' && styles.messageRowUser)}>
                                    <div className={clsx(styles.avatar, msg.role === 'assistant' ? styles.avatarAssistant : styles.avatarUser)}>
                                        {msg.role === 'assistant' ? (
                                            <>
                                                <Image src="/logo.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoDark} />
                                                <Image src="/zizzy-light.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoLight} />
                                            </>
                                        ) : (
                                            profileImage ? (
                                                <Image
                                                    src={profileImage}
                                                    alt="User"
                                                    width={32}
                                                    height={32}
                                                    className={styles.userProfileImage}
                                                />
                                            ) : (
                                                <User size={16} />
                                            )
                                        )}
                                    </div>

                                    <div className={clsx(styles.messageContent, msg.role === 'user' && styles.messageContentUser)}>
                                        <p className={styles.senderName}>
                                            {msg.role === 'assistant' ? 'Zizzy' : profileName}
                                        </p>
                                        <div className={clsx(styles.bubble, msg.role === 'assistant' ? styles.bubbleAssistant : styles.bubbleUser)}>
                                            {/* Use FormattedMessage for User too to render images */}
                                            <FormattedMessage
                                                content={msg.content}
                                                role={msg.role}
                                                canMarkDecision={false}
                                                onMarkDecision={async (text) => {
                                                    try {
                                                        const { data: { session } } = await supabase.auth.getSession();
                                                        const token = session?.access_token;

                                                        const res = await fetch('/api/insights', {
                                                            method: 'POST',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            body: JSON.stringify({ text })
                                                        });

                                                        if (res.ok) {
                                                            // Trigger storage event for other components to update (still useful if using SWR later, but here for consistency)
                                                            // Actually simpler to dispatch a custom event that InsightsPanel listens to.
                                                            window.dispatchEvent(new Event('insight-added'));
                                                            alert("Saved to Insights!");
                                                        } else {
                                                            alert("Failed to save insight.");
                                                        }
                                                    } catch (e) {
                                                        console.error("Error saving insight", e);
                                                        alert("Error saving insight.");
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Status Message (Searching...) */}
                            {statusMessage && (
                                <div className={clsx(styles.messageRow, styles.messageRowAssistant)}>
                                    <div className={clsx(styles.avatar, styles.avatarAssistant)}>
                                        <Image src="/logo.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoDark} />
                                        <Image src="/zizzy-light.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoLight} />
                                    </div>
                                    <div className={styles.messageContent}>
                                        <p className={styles.senderName}>Zizzy</p>
                                        <div className={clsx(styles.bubble, styles.bubbleAssistant, styles.statusBubble)}>
                                            <span className={styles.statusText}>🔍 {statusMessage}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {streamingMessage && (
                                <div className={clsx(styles.messageRow, styles.messageRowAssistant)}>
                                    <div className={clsx(styles.avatar, styles.avatarAssistant)}>
                                        <Image src="/logo.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoDark} />
                                        <Image src="/zizzy-light.png" alt="Zizzy" width={24} height={24} style={{ objectFit: "contain" }} className={styles.logoLight} />
                                    </div>
                                    <div className={styles.messageContent}>
                                        <p className={styles.senderName}>Zizzy</p>
                                        <div className={clsx(styles.bubble, styles.bubbleAssistant)}>
                                            <FormattedMessage
                                                content={streamingMessage}
                                                role="assistant"
                                                canMarkDecision={false} // Don't stream decisions
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Bottom Input Area */}
                        <div className={styles.inputArea}>
                            <div
                                className={styles.inputWrapper}
                                style={{ flexDirection: 'column', alignItems: 'stretch', padding: '10px' }}
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                            >
                                {/* File Previews for Active State */}
                                {selectedFiles.length > 0 && (
                                    <div className={styles.filePreviewRow} style={{ paddingBottom: '8px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
                                        {selectedFiles.map((file, i) => (
                                            <div key={i} style={{ position: 'relative', display: 'flex', alignItems: 'center', background: 'rgba(128,128,128,0.2)', borderRadius: '6px', padding: '4px 8px' }}>
                                                {file.type.startsWith('image/') ?
                                                    <img src={file.preview} alt="preview" style={{ width: 24, height: 24, objectFit: 'cover', borderRadius: '4px', marginRight: '6px' }} />
                                                    : <Paperclip size={16} style={{ marginRight: '6px' }} />
                                                }
                                                <span style={{ fontSize: '12px', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.file.name}</span>
                                                <button onClick={() => removeFile(i)} style={{ marginLeft: '6px', cursor: 'pointer', border: 'none', background: 'transparent', color: 'inherit' }}>
                                                    <X size={12} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                                    <button
                                        className={styles.iconBtn}
                                        onClick={triggerFileInput} // Map + to import
                                        title="Import File"
                                    >
                                        <Plus size={20} />
                                    </button>

                                    <input
                                        type="text"
                                        className={styles.inputField}
                                        placeholder={getPlaceholder()}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                        disabled={isTyping}
                                        style={{ flex: 1 }}
                                    />

                                    <button onClick={() => handleSend()} className={styles.sendBtn}>
                                        {isTyping ? <Square size={16} fill="currentColor" /> : <Send size={18} />}
                                    </button>
                                </div>
                            </div>
                            <p className={styles.disclaimer}>
                                Automated website development & management — coming soon 🚀
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
