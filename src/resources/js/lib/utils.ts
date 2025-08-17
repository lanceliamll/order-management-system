import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isValid, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(value);
}

/**
 * Format a date to a readable string using date-fns
 * @param date Date object or string to format
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined | null): string {
    if (!date) return 'No date';
    
    try {
        // For ISO strings, use parseISO which is more reliable
        const dateObj = typeof date === 'string' ? parseISO(date) : date;
        
        // Check if the date is valid before formatting
        if (!isValid(dateObj)) {
            return 'Invalid date';
        }
        
        return format(dateObj, 'MMM d, yyyy h:mm a');
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}