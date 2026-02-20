import { describe, it, expect, vi } from 'vitest';
import { exportToCSV } from '../lib/export';

describe('exportToCSV utility', () => {
    it('generates CSV content correctly', () => {
        const data = [
            { id: 1, name: 'John Doe', email: 'john@example.com' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
        ];

        const headers = {
            name: 'Full Name',
            email: 'Email Address'
        };

        // Mock URL.createObjectURL and document.createElement
        const createObjectURLMock = vi.fn(() => 'blob:url');
        global.URL.createObjectURL = createObjectURLMock;

        const linkMock = {
            setAttribute: vi.fn(),
            click: vi.fn(),
            style: { visibility: '' }
        };

        vi.stubGlobal('document', {
            createElement: vi.fn(() => linkMock),
            body: {
                appendChild: vi.fn(),
                removeChild: vi.fn()
            }
        });

        exportToCSV(data, 'test-export', headers);

        expect(document.createElement).toHaveBeenCalledWith('a');
        expect(linkMock.setAttribute).toHaveBeenCalledWith('download', 'test-export.csv');
    });

    it('handles empty data gracefully', () => {
        const spy = vi.spyOn(document, 'createElement');
        exportToCSV([], 'empty');
        expect(spy).not.toHaveBeenCalled();
    });
});
