import { describe, it, expect, vi } from "vitest";
import { commentService } from "../services/comments";
import { MENTION_REGEX } from "../utils/user";
import { notificationService } from "../services/notifications";

// Mock Supabase client
vi.mock("@/integrations/supabase/client", () => ({
    supabase: {
        from: vi.fn(() => ({
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockReturnValue({ data: null, error: null }),
            maybeSingle: vi.fn().mockReturnValue({ data: null, error: null }),
        })),
    },
}));

describe("Mention Logic", () => {
    describe("MENTION_REGEX", () => {
        it("should match standardized tags", () => {
            const content = "Hello @JohnDoe#1234 and @Jane#abcd";
            const matches = content.match(MENTION_REGEX);
            expect(matches).toEqual(["@JohnDoe#1234", "@Jane#abcd"]);
        });

        it("should extract mentions correctly", () => {
            const content = "Hey @User#5678, check this out";
            const mentions = commentService.extractMentions(content);
            expect(mentions).toEqual(["User#5678"]);
        });
    });

    describe("NotificationService", () => {
        it("should resolve user ID by tag", async () => {
            const mockData = { user_id: 'user-123' };
            // Import the mocked supabase and override for this test
            const { supabase } = await import("@/integrations/supabase/client");

            const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
            (supabase.from as any).mockReturnValue({
                select: vi.fn().mockReturnThis(),
                eq: vi.fn().mockReturnThis(),
                single: mockSingle
            });

            const userId = await notificationService.resolveUserIdByTag("Test#1234", "company-123");
            expect(userId).toBe('user-123');
        });
    });
});
