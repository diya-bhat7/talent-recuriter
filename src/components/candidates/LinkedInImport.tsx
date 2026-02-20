/**
 * LinkedIn Import Component
 * Parse LinkedIn profile URL and auto-fill candidate form
 */

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Linkedin, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LinkedInImportProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onImport: (data: LinkedInData) => void;
}

export interface LinkedInData {
    name: string;
    linkedin_url: string;
    email?: string;
    headline?: string;
}

/**
 * Extract profile info from LinkedIn URL
 * Note: Due to LinkedIn's restrictions, we can only extract the username
 * and provide a link. Full data extraction would require their API or scraping.
 */
function parseLinkedInUrl(url: string): { valid: boolean; username?: string; cleanUrl?: string } {
    const patterns = [
        /linkedin\.com\/in\/([a-zA-Z0-9_-]+)/,
        /linkedin\.com\/pub\/([a-zA-Z0-9_-]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            const username = match[1];
            const cleanUrl = `https://www.linkedin.com/in/${username}`;
            return { valid: true, username, cleanUrl };
        }
    }

    return { valid: false };
}

/**
 * Convert LinkedIn username to a likely name
 * (e.g., "john-doe-123abc" -> "John Doe")
 */
function usernameToName(username: string): string {
    return username
        .replace(/-\w{6,}$/, '') // Remove trailing ID
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim();
}

export function LinkedInImport({ open, onOpenChange, onImport }: LinkedInImportProps) {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<LinkedInData | null>(null);

    const handleParse = async () => {
        setError(null);
        setPreview(null);
        setLoading(true);

        try {
            const parsed = parseLinkedInUrl(url);

            if (!parsed.valid || !parsed.username || !parsed.cleanUrl) {
                setError('Invalid LinkedIn URL. Please enter a valid profile URL.');
                return;
            }

            // Generate preview data
            const data: LinkedInData = {
                name: usernameToName(parsed.username),
                linkedin_url: parsed.cleanUrl,
            };

            setPreview(data);
        } catch (err) {
            setError('Failed to parse LinkedIn URL');
        } finally {
            setLoading(false);
        }
    };

    const handleImport = () => {
        if (preview) {
            onImport(preview);
            onOpenChange(false);
            // Reset state
            setUrl('');
            setPreview(null);
            setError(null);
        }
    };

    const handleClose = () => {
        setUrl('');
        setPreview(null);
        setError(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Linkedin className="h-5 w-5 text-[#0A66C2]" />
                        Import from LinkedIn
                    </DialogTitle>
                    <DialogDescription>
                        Paste a LinkedIn profile URL to auto-fill candidate details.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* URL Input */}
                    <div className="space-y-2">
                        <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
                        <div className="flex gap-2">
                            <Input
                                id="linkedin-url"
                                placeholder="https://linkedin.com/in/john-doe"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                disabled={loading}
                            />
                            <Button
                                type="button"
                                onClick={handleParse}
                                disabled={!url.trim() || loading}
                            >
                                {loading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    'Parse'
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Error */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Preview */}
                    {preview && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            <AlertDescription className="text-green-800">
                                <div className="space-y-1">
                                    <p><strong>Name:</strong> {preview.name}</p>
                                    <p><strong>URL:</strong> {preview.linkedin_url}</p>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleImport}
                        disabled={!preview}
                        className="bg-[#0A66C2] hover:bg-[#004182]"
                    >
                        <Linkedin className="h-4 w-4 mr-2" />
                        Import Candidate
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
