/**
 * Utility function to export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
    data: T[],
    filename: string,
    headers?: Record<keyof T | string, string>
) {
    if (!data || data.length === 0) return;

    // Use provided headers or extract from first object
    const csvHeaders = headers
        ? Object.keys(headers)
        : Object.keys(data[0]);

    const headerRow = headers
        ? Object.values(headers).join(',')
        : csvHeaders.join(',');

    const rows = data.map(item => {
        return csvHeaders.map(header => {
            const val = item[header as keyof T];
            // Handle arrays, objects, and strings with commas
            if (Array.isArray(val)) {
                return `"${val.join('; ')}"`;
            }
            if (typeof val === 'string') {
                return `"${val.replace(/"/g, '""')}"`;
            }
            if (val === null || val === undefined) {
                return '""';
            }
            return `"${val}"`;
        }).join(',');
    });

    const csvContent = [headerRow, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
