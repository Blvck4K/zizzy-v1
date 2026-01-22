"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Pin, PinOff, Edit2, Check } from "lucide-react";
import styles from "./HistoryPopup.module.css";
import { useUser, ChatSession } from "@/context/UserContext";
import clsx from "clsx";

interface HistoryPopupProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<any>;
}

export default function HistoryPopup({ isOpen, onClose, triggerRef }: HistoryPopupProps) {
    const { history, deleteChat, togglePinChat, renameChat, selectChat, currentChatId } = useUser();
    const popupRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);

    // Rename State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState("");

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // Position to the right of the button, slightly elevated or aligned top
            setCoords({
                top: rect.top,
                left: rect.right + 10 // 10px gap
            });
        }
    }, [isOpen, triggerRef]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, onClose, triggerRef]);

    const handleSelect = (id: string) => {
        if (editingId) return;
        selectChat(id);
        onClose();
    };

    const startEdit = (e: React.MouseEvent, item: ChatSession) => {
        e.stopPropagation();
        setEditingId(item.id);
        setEditTitle(item.title);
    };

    const saveEdit = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (editingId && editTitle.trim()) {
            await renameChat(editingId, editTitle.trim());
        }
        setEditingId(null);
    };

    const cancelEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingId(null);
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            className={styles.popup}
            ref={popupRef}
            style={{
                top: coords.top,
                left: coords.left,
                position: 'fixed', // Ensure fixed positioning
                marginLeft: 0 // Override module css if needed
            }}
        >
            <div className={styles.header}>
                <h3 className={styles.title}>History</h3>
                <button onClick={onClose} className={styles.closeBtn}>
                    <X size={16} />
                </button>
            </div>

            <div className={styles.list}>
                {history.length === 0 ? (
                    <div className={styles.emptyState}>No history yet.</div>
                ) : (
                    history.map((item) => (
                        <div
                            key={item.id}
                            className={clsx(styles.item, currentChatId === item.id && styles.activeItem)}
                            onClick={() => handleSelect(item.id)}
                        >
                            {editingId === item.id ? (
                                <div className={styles.editContainer} onClick={e => e.stopPropagation()}>
                                    <input
                                        type="text"
                                        value={editTitle}
                                        onChange={e => setEditTitle(e.target.value)}
                                        className={styles.editInput}
                                        autoFocus
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') saveEdit(e as any);
                                            if (e.key === 'Escape') cancelEdit(e as any);
                                        }}
                                    />
                                    <button onClick={saveEdit} className={styles.actionBtn} title="Save">
                                        <Check size={14} />
                                    </button>
                                    <button onClick={cancelEdit} className={styles.actionBtn} title="Cancel">
                                        <X size={14} />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <span className={styles.itemTitle}>{item.title}</span>
                                    <div className={styles.actions}>
                                        <button
                                            onClick={(e) => startEdit(e, item)}
                                            className={styles.actionBtn}
                                            title="Rename"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); togglePinChat(item.id); }}
                                            className={clsx(styles.actionBtn, item.pinned && styles.activePin)}
                                            title={item.pinned ? "Unpin" : "Pin"}
                                        >
                                            {item.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteChat(item.id); }}
                                            className={styles.actionBtn}
                                            title="Delete"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>,
        document.body
    );
}
