import React from 'react';
import DOMPurify from 'dompurify';
import { MentionPreview } from './MentionPreview';

interface MentionTextProps {
    content: string;
    className?: string;
}

/**
 * A reusable component that parses text for @mentions and renders them 
 * using the MentionPreview component.
 * Content is sanitized with DOMPurify to prevent XSS attacks.
 */
export const MentionText = ({ content, className }: MentionTextProps) => {
    if (!content) return null;

    // Sanitize content to strip any injected HTML/scripts
    const sanitized = DOMPurify.sanitize(content, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });

    // Use a regex that captures the whole @Name#1234 part
    // Using capturing group () ensures the matches are included in the split array
    const parts = sanitized.split(/(@[\w\d#]+)/g);

    return (
        <span className={className}>
            {parts.map((part, idx) => {
                if (part.startsWith('@')) {
                    // Extract the username (without @ symbol) for the resolver
                    const username = part.substring(1);
                    return (
                        <MentionPreview key={idx} username={username}>
                            {part}
                        </MentionPreview>
                    );
                }
                return part;
            })}
        </span>
    );
};
