/**
 * Document Preview Modal
 * Displays JD or Interview Prep document with scrollable content and download options
 */

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
    FileText,
    ExternalLink,
    Download,
} from 'lucide-react';
import { useState } from 'react';
import { DocumentPreview } from '@/components/ui/DocumentPreview';

interface DocumentPreviewModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    content: string | null;
    fileUrl: string | null;
    type: 'jd' | 'interview_prep';
}

export function DocumentPreviewModal({
    open,
    onOpenChange,
    title,
    content,
    fileUrl,
    type,
}: DocumentPreviewModalProps) {

    const hasContent = content || fileUrl;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl h-[80vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${type === 'jd'
                            ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
                            }`}>
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg">{title}</DialogTitle>
                            <Badge variant="secondary" className="mt-1">
                                {type === 'jd' ? 'Job Description' : 'Interview Prep'}
                            </Badge>
                        </div>
                    </div>
                </DialogHeader>


                {!hasContent ? (
                    <div className="flex-1 flex items-center justify-center py-12">
                        <div className="text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No {type === 'jd' ? 'job description' : 'interview prep document'} available</p>
                            <p className="text-sm mt-1">Add one when editing the position</p>
                        </div>
                    </div>
                ) : content ? (
                    <div className="flex-1 overflow-auto py-2">
                        <DocumentPreview
                            title={title}
                            description={type === 'jd' ? 'Job Description' : 'Interview Preparation'}
                            content={content}
                            type={type === 'jd' ? 'job-description' : 'interview-prep'}
                        />
                    </div>
                ) : fileUrl ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12">
                        <div className="bg-muted/50 rounded-lg p-8 text-center max-w-sm">
                            <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                            <p className="font-semibold mb-2">External Document</p>
                            <p className="text-sm text-muted-foreground mb-6">
                                This document is stored as an external file.
                            </p>
                            <div className="flex gap-2 justify-center">
                                <Button asChild variant="outline">
                                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Open
                                    </a>
                                </Button>
                                <Button asChild>
                                    <a href={fileUrl} download>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
