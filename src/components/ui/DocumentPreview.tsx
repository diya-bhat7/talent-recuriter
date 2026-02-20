import { useState } from 'react';
import {
    FileText,
    Download,
    Search,
    Plus,
    Minus,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    FileCode,
    FileType,
    File
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface DocumentPreviewProps {
    title: string;
    description?: string;
    content: string;
    type?: 'job-description' | 'interview-prep';
    status?: 'Generated' | 'Draft';
    className?: string;
}

export function DocumentPreview({
    title,
    description,
    content,
    type = 'job-description',
    status = 'Generated',
    className
}: DocumentPreviewProps) {
    const [zoom, setZoom] = useState(100);
    const [page, setPage] = useState(1);
    const totalPages = 1; // Simplified for now

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));

    const downloadFile = (format: 'txt' | 'pdf' | 'doc') => {
        const timestamp = new Date().getTime();
        const filename = `${title.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.${format === 'doc' ? 'doc' : format}`;

        let blobContent = content;
        let mimeType = 'text/plain';

        if (format === 'doc') {
            // HTML to Word trick
            blobContent = `
                <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
                <head><meta charset='utf-8'><title>${title}</title></head>
                <body>
                    <h1>${title}</h1>
                    <div style="font-family: Arial, sans-serif; white-space: pre-wrap;">
                        ${content.replace(/\n/g, '<br/>')}
                    </div>
                </body>
                </html>
            `;
            mimeType = 'application/msword';
        } else if (format === 'pdf') {
            // For real PDF, usually jspdf is needed. For now, we use window.print simulation or simple text Blob.
            // Simplified: User can usually print to PDF from browser. 
            // We'll provide it as a text blob with PDF extension as a fallback if no lib, 
            // but that's not a real PDF. I'll use window.print() and tell the user.
            window.print();
            return;
        }

        const blob = new Blob([blobContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    return (
        <Card className={cn("overflow-hidden border-border/50 shadow-lg bg-background", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b bg-muted/20">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">{title}</CardTitle>
                        {description && <CardDescription className="text-xs">{description}</CardDescription>}
                    </div>
                </div>
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="text-xs font-semibold">{status}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 bg-muted/10 relative">
                {/* Inner Toolbar */}
                <div className="flex items-center justify-between px-4 py-2 border-b bg-background/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-muted-foreground border-r pr-4">
                            <Search className="h-4 w-4" />
                        </div>
                        <div className="flex items-center gap-3">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomOut}>
                                <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleZoomIn}>
                                <Plus className="h-3 w-3" />
                            </Button>
                        </div>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline" className="gap-2 h-8 px-3">
                                <Download className="h-3.5 w-3.5" />
                                <span className="text-xs font-semibold">Download</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => downloadFile('txt')} className="gap-3 cursor-pointer">
                                <FileCode className="h-4 w-4 text-blue-500" />
                                <span>Text File (.txt)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadFile('doc')} className="gap-3 cursor-pointer">
                                <File className="h-4 w-4 text-primary" />
                                <span>Word Document (.doc)</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadFile('pdf')} className="gap-3 cursor-pointer">
                                <FileType className="h-4 w-4 text-red-500" />
                                <span>PDF Document (.pdf)</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Document Paper */}
                <div className="p-8 flex justify-center overflow-auto min-h-[400px]">
                    <div
                        id="printable-document"
                        className="bg-white shadow-2xl rounded-sm border transition-all duration-200 origin-top"
                        style={{
                            width: `${Math.max(600, zoom * 7)}px`,
                            padding: '40px 60px',
                            minHeight: '800px'
                        }}
                    >
                        <div className="prose prose-slate max-w-none">
                            <h1 className="border-b pb-4 mb-8 text-2xl font-bold text-slate-900">{title}</h1>
                            <div className="whitespace-pre-wrap font-sans text-[15px] leading-relaxed text-slate-700">
                                {content}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Bottom Pagination Info */}
                <div className="bg-background/80 backdrop-blur-sm border-t py-2 px-4 flex items-center justify-center gap-6">
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs font-medium text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
