import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../components/ui/EmptyState';
import { Search } from 'lucide-react';
import React from 'react';

describe('EmptyState Component', () => {
    const props = {
        icon: Search,
        title: 'No results found',
        description: 'Try adjusting your search filters.',
        actionLabel: 'Clear Filters',
        onAction: () => console.log('Action clicked'),
    };

    it('renders the title and description correctly', () => {
        render(<EmptyState {...props} />);
        expect(screen.getByText(props.title)).toBeDefined();
        expect(screen.getByText(props.description)).toBeDefined();
    });

    it('renders the action button when actionLabel is provided', () => {
        render(<EmptyState {...props} />);
        const button = screen.getByText(props.actionLabel);
        expect(button).toBeDefined();
    });

    it('triggers onAction when the action button is clicked', () => {
        let clicked = false;
        const onAction = () => { clicked = true; };
        render(<EmptyState {...props} onAction={onAction} />);

        const button = screen.getByText(props.actionLabel);
        fireEvent.click(button);
        expect(clicked).toBe(true);
    });

    it('does not render the action button when actionLabel is missing', () => {
        const { actionLabel, ...rest } = props;
        render(<EmptyState {...rest} />);
        expect(screen.queryByText(props.actionLabel)).toBeNull();
    });
});
