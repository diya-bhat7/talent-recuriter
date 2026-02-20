import { format } from 'date-fns';

export interface CalendarEvent {
    title: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
}

export const getGoogleCalendarUrl = (event: CalendarEvent): string => {
    const start = format(event.startTime, "yyyyMMdd'T'HHmmss");
    const end = format(event.endTime, "yyyyMMdd'T'HHmmss");

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: event.title,
        dates: `${start}/${end}`,
        details: event.description || '',
        location: event.location || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

export const getOutlookCalendarUrl = (event: CalendarEvent): string => {
    const start = format(event.startTime, "yyyy-MM-dd'T'HH:mm:ss");
    const end = format(event.endTime, "yyyy-MM-dd'T'HH:mm:ss");

    const params = new URLSearchParams({
        path: '/calendar/action/compose',
        rru: 'addevent',
        startdt: start,
        enddt: end,
        subject: event.title,
        body: event.description || '',
        location: event.location || '',
    });

    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
};
