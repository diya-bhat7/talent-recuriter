import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MultiSelectProps {
    options: string[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = 'Select options...',
    className,
}: MultiSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleToggle = (option: string) => {
        if (selected.includes(option)) {
            onChange(selected.filter((item) => item !== option));
        } else {
            onChange([...selected, option]);
        }
    };

    const handleRemove = (option: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter((item) => item !== option));
    };

    return (
        <div ref={containerRef} className={cn('relative', className)}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'min-h-[42px] w-full rounded-lg border border-input bg-background px-3 py-2 cursor-pointer',
                    'flex flex-wrap gap-1 items-center',
                    'hover:border-primary/50 transition-colors',
                    isOpen && 'ring-2 ring-primary/20 border-primary'
                )}
            >
                {selected.length > 0 ? (
                    selected.map((item) => (
                        <Badge
                            key={item}
                            variant="secondary"
                            className="flex items-center gap-1 text-xs"
                        >
                            {item}
                            <X
                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                onClick={(e) => handleRemove(item, e)}
                            />
                        </Badge>
                    ))
                ) : (
                    <span className="text-muted-foreground text-sm">{placeholder}</span>
                )}
            </div>

            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg py-1 max-h-60 overflow-auto">
                        {options.map((option) => (
                            <div
                                key={option}
                                onClick={() => handleToggle(option)}
                                className={cn(
                                    'px-3 py-2 cursor-pointer hover:bg-accent transition-colors text-sm',
                                    selected.includes(option) && 'bg-accent'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            'w-4 h-4 rounded border flex items-center justify-center',
                                            selected.includes(option)
                                                ? 'bg-primary border-primary'
                                                : 'border-muted-foreground'
                                        )}
                                    >
                                        {selected.includes(option) && (
                                            <svg
                                                className="w-3 h-3 text-primary-foreground"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M5 13l4 4L19 7"
                                                />
                                            </svg>
                                        )}
                                    </div>
                                    {option}
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}

interface FileUploadProps {
    onFileSelect: (file: File | null) => void;
    selectedFile: File | null;
    accept?: string;
    maxSize?: number; // in MB
}

export function FileUpload({
    onFileSelect,
    selectedFile,
    accept = '.pdf,.doc,.docx',
    maxSize = 10,
}: FileUploadProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (file: File | null) => {
        setError(null);
        if (file) {
            if (file.size > maxSize * 1024 * 1024) {
                setError(`File size must be less than ${maxSize}MB`);
                return;
            }
            onFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        handleFileChange(file);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    return (
        <div>
            <div
                onClick={() => inputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={cn(
                    'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200',
                    isDragging
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50 hover:bg-muted/50'
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                    className="hidden"
                />

                {selectedFile ? (
                    <div className="flex items-center justify-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div className="text-left">
                            <p className="font-medium text-sm">{selectedFile.name}</p>
                            <p className="text-xs text-muted-foreground">
                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onFileSelect(null);
                            }}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <>
                        <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm font-medium">Upload PDF or Word document</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            PDF, DOC up to {maxSize}MB
                        </p>
                    </>
                )}
            </div>
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
        </div>
    );
}
