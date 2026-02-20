/**
 * Image Optimization Utilities
 * Serves resized and WebP formatted images via Supabase Image Transformation
 */

interface ImageOptions {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill';
}

/**
 * Transforms a Supabase storage URL into an optimized version.
 * Requires Supabase Image Transformation to be enabled on the project (Pro plan).
 * Falls back to original URL if it's not a Supabase URL or transformation fails.
 */
export function getOptimizedImageUrl(url: string | null | undefined, options: ImageOptions = {}): string {
    if (!url) return '';

    // Check if it's a Supabase storage URL
    if (!url.includes('storage/v1/object/public')) {
        return url;
    }

    const { width = 200, height = 200, quality = 80, resize = 'cover' } = options;

    try {
        const urlObj = new URL(url);

        // Supabase Image Transformation URL format:
        // /storage/v1/render/image/public/[bucket]/[path]?width=[w]&height=[h]&quality=[q]&resize=[r]&format=webp

        // Convert 'public' path to 'render' path
        const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
        if (pathParts.length !== 2) return url;

        const bucketAndPath = pathParts[1];
        const newPath = `/storage/v1/render/image/public/${bucketAndPath}`;

        urlObj.pathname = newPath;
        urlObj.searchParams.set('width', width.toString());
        urlObj.searchParams.set('height', height.toString());
        urlObj.searchParams.set('quality', quality.toString());
        urlObj.searchParams.set('resize', resize);
        urlObj.searchParams.set('format', 'webp');

        return urlObj.toString();
    } catch (e) {
        console.warn('Failed to parse URL for image optimization:', e);
        return url;
    }
}
