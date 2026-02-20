import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CandidateCard, Candidate } from '@/components/candidates/CandidateCard';
import React from 'react';

// Mock candidate data
const mockCandidate: Candidate = {
    id: '1',
    position_id: 'pos-1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    status: 'interview',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
};

describe('CandidateCard', () => {
    const mockOnClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders candidate name', () => {
        render(
            <CandidateCard
                candidate={mockCandidate}
                onClick={mockOnClick}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onStatusChange={vi.fn()}
            />
        );

        expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('displays avatar with correct initials', () => {
        render(
            <CandidateCard
                candidate={mockCandidate}
                onClick={mockOnClick}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onStatusChange={vi.fn()}
            />
        );

        expect(screen.getByText('JD')).toBeInTheDocument();
    });

    it('triggers onClick when clicked', () => {
        render(
            <CandidateCard
                candidate={mockCandidate}
                onClick={mockOnClick}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onStatusChange={vi.fn()}
            />
        );

        // Click the outer div
        const card = screen.getByText('John Doe').closest('div');
        if (card) fireEvent.click(card);

        expect(mockOnClick).toHaveBeenCalledWith(mockCandidate);
    });

    it('handles single name for initials correctly', () => {
        const singleNameCandidate = { ...mockCandidate, name: 'Madonna' };

        render(
            <CandidateCard
                candidate={singleNameCandidate}
                onClick={mockOnClick}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onStatusChange={vi.fn()}
            />
        );

        expect(screen.getByText('M')).toBeInTheDocument();
    });
});
