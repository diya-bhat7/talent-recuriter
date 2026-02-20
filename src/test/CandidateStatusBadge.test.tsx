import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CandidateStatusBadge, CANDIDATE_STATUS_OPTIONS } from '@/components/candidates/CandidateStatusBadge';

describe('CandidateStatusBadge', () => {
    it('renders the correct label for each status', () => {
        const statuses = ['new', 'screening', 'interview', 'offer', 'hired', 'rejected'] as const;
        const labels = ['New', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

        statuses.forEach((status, index) => {
            const { unmount } = render(<CandidateStatusBadge status={status} />);
            expect(screen.getByText(labels[index])).toBeInTheDocument();
            unmount();
        });
    });

    it('applies custom className', () => {
        render(<CandidateStatusBadge status="new" className="custom-class" />);
        const badge = screen.getByText('New');
        expect(badge).toHaveClass('custom-class');
    });

    it('renders with small size', () => {
        render(<CandidateStatusBadge status="hired" size="sm" />);
        const badge = screen.getByText('Hired');
        expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs');
    });

    it('renders with medium size by default', () => {
        render(<CandidateStatusBadge status="hired" size="md" />);
        const badge = screen.getByText('Hired');
        expect(badge).toHaveClass('px-2.5', 'py-1', 'text-xs');
    });

    it('applies correct color classes for each status', () => {
        const { unmount } = render(<CandidateStatusBadge status="new" />);
        expect(screen.getByText('New')).toHaveClass('bg-blue-100', 'text-blue-700');
        unmount();

        const { unmount: unmount2 } = render(<CandidateStatusBadge status="hired" />);
        expect(screen.getByText('Hired')).toHaveClass('bg-green-100', 'text-green-700');
        unmount2();

        const { unmount: unmount3 } = render(<CandidateStatusBadge status="rejected" />);
        expect(screen.getByText('Rejected')).toHaveClass('bg-red-100', 'text-red-700');
        unmount3();
    });
});

describe('CANDIDATE_STATUS_OPTIONS', () => {
    it('contains all 6 status options', () => {
        expect(CANDIDATE_STATUS_OPTIONS).toHaveLength(6);
    });

    it('has correct value-label pairs', () => {
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'new', label: 'New' });
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'screening', label: 'Screening' });
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'interview', label: 'Interview' });
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'offer', label: 'Offer' });
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'hired', label: 'Hired' });
        expect(CANDIDATE_STATUS_OPTIONS).toContainEqual({ value: 'rejected', label: 'Rejected' });
    });
});
