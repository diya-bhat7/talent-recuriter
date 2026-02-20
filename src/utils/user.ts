/**
 * User Utilities
 * Standardized logic for user data across the application
 */

/**
 * Generates a "clean" username for @mentions.
 * Removes whitespace and adds a unique numeric suffix based on user ID.
 * Example: "John Doe" with ID "1cf4..." -> "JohnDoe#1cf4"
 */
export function getCleanUsername(name: string, id: string): string {
    if (!name) return `User#${id.slice(0, 4)}`;
    const cleanName = name.replace(/\s+/g, '');
    const shortId = id.slice(0, 4);
    return `${cleanName}#${shortId}`;
}

/**
 * Regex for matching standardized @mentions in text.
 * Matches @ followed by alphanumeric characters and the # suffix.
 */
export const MENTION_REGEX = /@([\w\d#]+)/g;

/**
 * Gets initials from a name (max 2 characters)
 */
export function getInitials(name: string): string {
    if (!name) return '??';
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}
