/**
 * Comment Section Component
 * Displays comments thread and allows adding new comments
 */

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { useComments, useAddComment, useDeleteComment, useUpdateComment, useCommentsRealtime } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { getCleanUsername, getInitials } from '@/utils/user';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { usePresence } from '@/hooks/usePresence';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import {
    MessageSquare,
    Send,
    Trash2,
    MoreHorizontal,
    Pencil,
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MentionText } from './MentionText';
import { MentionSuggestor, MentionUser } from '@/components/ui/MentionSuggestor';

interface CommentSectionProps {
    candidateId: string;
    candidateName: string;
    companyId?: string;
}


export function CommentSection({ candidateId, candidateName, companyId }: CommentSectionProps) {
    const { user } = useAuth();
    const { data: comments, isLoading } = useComments(candidateId);
    const addComment = useAddComment(
        candidateId,
        user?.id,
        user?.user_metadata?.full_name || user?.email || 'Unknown User'
    );
    const deleteComment = useDeleteComment(candidateId);
    const updateComment = useUpdateComment(candidateId);

    // Real-time updates
    useCommentsRealtime(candidateId);

    const [newComment, setNewComment] = useState('');
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    // Mention state
    const [showMentions, setShowMentions] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionUsers, setMentionUsers] = useState<MentionUser[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { viewers, updatePresence } = usePresence(candidateId);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Derive mentionable users from comments history (fallback strategy)
    useEffect(() => {
        if (!comments) return;

        const uniqueUsers = new Map<string, MentionUser>();

        // Add current user
        if (user && user.email) {
            const name = user.user_metadata?.full_name || user.email.split('@')[0];
            uniqueUsers.set(user.id, {
                id: user.id,
                name: getCleanUsername(name, user.id),
                email: user.email
            });
        }

        // Add comment authors
        comments.forEach(c => {
            if (!uniqueUsers.has(c.user_id)) {
                // If the comment already has a mention_tag (from a future migration/join), use it.
                // Otherwise, fallback to the utility generation.
                const storedTag = (c as any).mention_tag;
                uniqueUsers.set(c.user_id, {
                    id: c.user_id,
                    name: storedTag || getCleanUsername(c.user_name, c.user_id),
                });
            }
        });

        setMentionUsers(Array.from(uniqueUsers.values()));
    }, [comments, user]);

    const typingViewers = viewers.filter(
        (v) => v.user_id !== user?.id && v.is_typing
    );

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setNewComment(value);

        // Detect mention trigger
        const cursorPosition = e.target.selectionStart;
        const textBeforeCursor = value.slice(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        if (lastAtSymbol !== -1) {
            const query = textBeforeCursor.slice(lastAtSymbol + 1);
            // Check if there are spaces, which means we might not be typing a mention anymore
            if (!/\s/.test(query)) {
                setMentionQuery(query);
                setShowMentions(true);
            } else {
                setShowMentions(false);
            }
        } else {
            setShowMentions(false);
        }

        if (!value.trim()) {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            updatePresence({ is_typing: false });
            return;
        }

        // Set typing to true
        updatePresence({ is_typing: true });

        // Debounce clearing typing state
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            updatePresence({ is_typing: false });
        }, 3000);
    };

    const handleMentionSelect = (selectedUser: MentionUser) => {
        const cursorPosition = textareaRef.current?.selectionStart || 0;
        const textBeforeCursor = newComment.slice(0, cursorPosition);
        const lastAtSymbol = textBeforeCursor.lastIndexOf('@');

        const newText =
            newComment.slice(0, lastAtSymbol) +
            `@${selectedUser.name} ` +
            newComment.slice(cursorPosition);

        setNewComment(newText);
        setShowMentions(false);

        // Reset focus
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                // We could set cursor position here if needed
            }
        }, 0);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (showMentions) {
            if (e.key === 'Escape') {
                e.preventDefault();
                setShowMentions(false);
            }
            // We could add arrow key navigation here later
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        await updatePresence({ is_typing: false });

        try {
            await addComment.mutateAsync({
                content: newComment.trim(),
                companyId,
                candidateName,
            });
            setNewComment('');
            toast.success('Comment added');
        } catch (error: any) {
            console.error('Failed to add comment:', error);
            toast.error(error.message || 'Failed to add comment');
        }
    };

    const handleDelete = async (commentId: string) => {
        if (!window.confirm('Are you sure you want to delete this comment?')) return;
        try {
            await deleteComment.mutateAsync(commentId);
            toast.success('Comment deleted');
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete comment');
        }
    };

    const handleStartEdit = (commentId: string, content: string) => {
        setEditingCommentId(commentId);
        setEditText(content);
    };

    const handleUpdate = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editText.trim() || !editingCommentId) return;

        try {
            await updateComment.mutateAsync({
                commentId: editingCommentId,
                content: editText.trim()
            });
            setEditingCommentId(null);
            setEditText('');
            toast.success('Comment updated');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update comment');
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <span>Comments ({comments?.length || 0})</span>
            </div>

            {/* Comment list */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                {isLoading ? (
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="flex gap-3">
                                <Skeleton className="h-8 w-8 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-12 w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : comments?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        No comments yet. Be the first to add one!
                    </p>
                ) : (
                    comments?.map((comment) => (
                        <div key={comment.id} className="flex gap-3 group">
                            <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                    {getInitials(comment.user_name)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium flex items-center gap-1.5">
                                        {comment.user_name}
                                        {comment.user_id === user?.id && (
                                            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100/50 shadow-sm">
                                                You
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(comment.created_at), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                    {comment.is_edited && (
                                        <span className="text-xs text-muted-foreground italic">
                                            (edited)
                                        </span>
                                    )}
                                </div>
                                {editingCommentId === comment.id ? (
                                    <div className="mt-2 space-y-2">
                                        <Textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="min-h-[80px] text-sm resize-none focus-visible:ring-primary"
                                            autoFocus
                                        />
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                type="button"
                                                onClick={() => setEditingCommentId(null)}
                                                className="h-8 text-xs"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                size="sm"
                                                type="button"
                                                onClick={() => handleUpdate()}
                                                disabled={!editText.trim() || updateComment.isPending}
                                                className="h-8 text-xs"
                                            >
                                                Save Changes
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-sm mt-1 whitespace-pre-wrap break-words leading-relaxed">
                                        <MentionText content={comment.content} />
                                    </div>
                                )}
                            </div>
                            {/* Actions menu (only for own comments) */}
                            {comment.user_id === user?.id && (
                                <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full"
                                        >
                                            <MoreHorizontal className="h-5 w-5" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="end"
                                        className="z-[200] min-w-[120px]"
                                        onCloseAutoFocus={(e) => e.preventDefault()}
                                    >
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleStartEdit(comment.id, comment.content);
                                        }}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Edit
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(comment.id);
                                            }}
                                            className="text-destructive focus:text-destructive font-medium"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Typing Indicator */}
            {typingViewers.length > 0 && (
                <div className="flex items-center gap-2 px-1 animate-in fade-in slide-in-from-bottom-1">
                    <div className="flex gap-1">
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 h-1 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">
                        {typingViewers.length === 1
                            ? `${typingViewers[0].user_name} is typing...`
                            : `${typingViewers.length} people are typing...`}
                    </span>
                </div>
            )}

            {/* Mention Suggestion Popover */}
            {showMentions && (
                <div className="relative">
                    <MentionSuggestor
                        query={mentionQuery}
                        users={mentionUsers}
                        onSelect={handleMentionSelect}
                        onClose={() => setShowMentions(false)}
                        position="top"
                    />
                </div>
            )}

            {/* Add comment form */}
            <form onSubmit={handleSubmit} className="flex gap-2 relative">
                <Textarea
                    ref={textareaRef}
                    placeholder="Add a comment... Use @name to mention someone"
                    value={newComment}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    className="min-h-[80px] resize-none focus-visible:ring-primary"
                />
                <Button
                    type="submit"
                    size="icon"
                    disabled={!newComment.trim() || addComment.isPending}
                    className="shrink-0"
                >
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}
