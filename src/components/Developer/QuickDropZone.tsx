import { useState, useRef } from "react";
import { Upload, Terminal } from "lucide-react";
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

    // Helper to read file content
    const processFile = async (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            setDroppedFile({ file, content });
        };
        reader.readAsText(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            await processFile(file);
        }
    };

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
            
            {!droppedFile ? (
                <div className={styles.emptyState}>
                    <Terminal size={32} className={styles.terminalIcon} />
                    <p className={styles.terminalText}>
                        Drop something here to think with AI <span className={styles.cursor}>_</span>
                    </p>
                    <div className={styles.supportedFormats}>
                        .js .ts .py .sql .md .txt
                    </div>
                </div>
            ) : (
                <div className={styles.quickDropZone}>
                    <div className={styles.dropText}>
                        <Upload size={20} />
                        <span>{droppedFile.file.name} is ready</span>
                    </div>
                    <div className={styles.actionButtons}>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setDroppedFile(null);
                            }} 
                            className={styles.cancelBtn}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
