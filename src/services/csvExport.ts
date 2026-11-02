import { ListSession, Item } from '../types';

/**
 * Escapes a cell value for standard RFC 4180 CSV format.
 */
function escapeCsvCell(value: string | number | boolean | undefined | null): string {
  if (value === undefined || value === null) return '""';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

/**
 * Converts sessions to CSV string.
 */
export function sessionsToCsv(sessions: ListSession[]): string {
  const headers = [
    'Date',
    'Session Title',
    'Item Name',
    'Amount / Quantity',
    'Category',
    'Status',
    'Note',
    'Created At',
    'Last Updated',
  ];

  const rows: string[] = [headers.map(escapeCsvCell).join(',')];

  sessions.forEach((session) => {
    session.items.forEach((item: Item) => {
      const row = [
        session.listDate,
        session.title || 'Grocery List',
        item.name,
        item.amount || '',
        item.category || 'Other',
        item.isCompleted ? 'Completed' : 'Pending',
        item.note || '',
        item.createdAt,
        item.updatedAt,
      ];
      rows.push(row.map(escapeCsvCell).join(','));
    });
  });

  return rows.join('\r\n');
}

/**
 * Formats a single session for direct clipboard paste into Google Sheets (Tab-Separated Values).
 */
export function sessionToTsvForSheets(session: ListSession): string {
  const headers = ['Item Name', 'Quantity / Amount', 'Category', 'Status', 'Note'];
  const rows: string[] = [headers.join('\t')];

  session.items.forEach((item) => {
    rows.push(
      [
        item.name,
        item.amount || '',
        item.category || 'Other',
        item.isCompleted ? 'Purchased' : 'Need to Buy',
        item.note || '',
      ].join('\t')
    );
  });

  return rows.join('\n');
}

/**
 * Triggers a browser download of the CSV file.
 */
export function downloadCsv(sessions: ListSession[], filename = 'grocery_note_taker_history.csv'): void {
  const csvContent = sessionsToCsv(sessions);
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
