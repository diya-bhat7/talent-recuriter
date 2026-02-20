# Developer Documentation

This document is automatically generated from JSDoc comments in the codebase.

## Hooks

### [useCandidates.ts](src/hooks/useCandidates.ts)

#### `useCandidates`

Hook to fetch all candidates for a position

#### `useCreateCandidate`

Hook to create a new candidate with optimistic updates

#### `useUpdateCandidate`

Hook to update a candidate with optimistic updates

#### `useUpdateCandidateStatus`

Hook to update candidate status (optimized for drag-and-drop)

#### `useDeleteCandidate`

Hook to delete a candidate with optimistic updates

---

### [useCandidatesRealtime.ts](src/hooks/useCandidatesRealtime.ts)

#### `useCandidatesRealtime`

Hook to subscribe to real-time candidate updates for a position
Automatically updates the React Query cache when changes occur

---

### [useComments.ts](src/hooks/useComments.ts)

#### `useComments`

useComments Hook
React Query hooks for candidate comments
/

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { commentService, Comment } from '@/services/comments';

// Query keys
export const commentKeys = {
    all: ['comments'] as const,
    candidate: (candidateId: string) => [...commentKeys.all, 'candidate', candidateId] as const,
};

/**
Fetch comments for a candidate

#### `useAddComment`

Add a new comment

#### `useUpdateComment`

Update an existing comment

#### `useDeleteComment`

Delete a comment

#### `useCommentsRealtime`

Real-time subscription for comments

---

### [useCompany.ts](src/hooks/useCompany.ts)

#### `useCompany`

Hook to fetch the current user's company
Note: This supplements useAuth's company - use for fresh data or mutations

#### `useUpdateCompany`

Hook to update company profile with optimistic updates

---

### [useDebounce.ts](src/hooks/useDebounce.ts)

#### `useDebounce`

Hook to debounce a value by a specified delay
Useful for search inputs to avoid excessive re-renders/API calls

@param value - The value to debounce
@param delay - Delay in milliseconds (default: 300ms)
@returns The debounced value

---

### [usePositions.ts](src/hooks/usePositions.ts)

#### `usePositions`

Hook to fetch all positions for the current company

#### `usePosition`

Hook to fetch a single position by ID

#### `useCreatePosition`

Hook to create a new position with optimistic updates

#### `useUpdatePosition`

Hook to update a position with optimistic updates

#### `useDeletePosition`

Hook to delete a position with optimistic updates

---

### [useScorecards.ts](src/hooks/useScorecards.ts)

#### `useScorecards`

useScorecards Hook
React Query hooks for interview scorecards
/

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { scorecardService, Scorecard } from '@/services/scorecards';
import type { Recommendation } from '@/types/advanced-features';

// Query keys
export const scorecardKeys = {
    all: ['scorecards'] as const,
    candidate: (candidateId: string) => [...scorecardKeys.all, 'candidate', candidateId] as const,
    single: (scorecardId: string) => [...scorecardKeys.all, 'single', scorecardId] as const,
    average: (candidateId: string) => [...scorecardKeys.all, 'average', candidateId] as const,
};

/**
Fetch scorecards for a candidate

#### `useCandidateAverageScore`

Get candidate's average score

#### `useCreateScorecard`

Create a new scorecard

#### `useUpdateScorecard`

Update a scorecard

#### `useDeleteScorecard`

Delete a scorecard

---

### [useSessionTimeout.ts](src/hooks/useSessionTimeout.ts)

#### `useSessionTimeout`

Hook to manage session timeout based on user inactivity.
@param user Current authenticated user
@param onTimeout Callback function to execute when timeout occurs

---

### [useVoiceNotes.ts](src/hooks/useVoiceNotes.ts)

#### `useVoiceNotes`

useVoiceNotes Hook
React Query hooks for voice notes
/

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceNoteService, VoiceNote } from '@/services/voiceNotes';

// Query keys
export const voiceNoteKeys = {
    all: ['voice-notes'] as const,
    candidate: (candidateId: string) => [...voiceNoteKeys.all, 'candidate', candidateId] as const,
};

/**
Fetch voice notes for a candidate

#### `useCreateVoiceNote`

Create a new voice note

#### `useDeleteVoiceNote`

Delete a voice note

---

## Services

## Lib

### [export.ts](src/lib/export.ts)

#### `exportToCSV`

Utility function to export data to CSV

---

