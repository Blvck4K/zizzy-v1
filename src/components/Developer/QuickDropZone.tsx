import { useState, useRef } from "react";
import { Upload, FileCode, FileText, Code2, Terminal, Play, Check, Sparkles, Wind } from "lucide-react";
import styles from "./DeveloperWorkspace.module.css";
import clsx from "clsx";

interface QuickDropZoneProps {
    onFileAction: (file: File, content: string, action: 'review' | 'refactor' | 'explain', model: 'gemini' | 'mistral') => void;
}

export default function QuickDropZone({ onFileAction }: QuickDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [droppedFile, setDroppedFile] = useState<{ file: File, content: string } | null>(null);
    const [selectedModel, setSelectedModel] = useState<'gemini' | 'mistral'>('gemini');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        export default function QuickDropZone() {
            return (
                <div className={styles.quickDropZone}>
                    <div className={styles.dropText}>
                        <Upload size={20} />
                        <span>Quick-Drop is locked</span>
                    </div>
                    <div className={styles.actionButtons}>
                        <span style={{ color: 'var(--muted-foreground)', fontWeight: 600 }}>Coming in v2</span>
                    </div>
                </div>
            );
        }
                <button onClick={() => setDroppedFile(null)} className={styles.cancelBtn}>
                    Cancel
                </button>
            </div>
        );
    }

    return (
        <div
            className={clsx(styles.dropZone, isDragging && styles.dropZoneHover)}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
        >
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && processFile(e.target.files[0])}
            />
            <div className={styles.emptyState}>
                <Terminal size={32} className={styles.terminalIcon} />
                <p className={styles.terminalText}>
                    Drop something here to think with AI <span className={styles.cursor}>_</span>
                </p>
                <div className={styles.supportedFormats}>
                    .js .ts .py .sql .md .txt
                </div>
            </div>
        </div>
    );
}
