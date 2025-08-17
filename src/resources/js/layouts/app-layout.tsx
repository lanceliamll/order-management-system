import AppHeaderLayout from '@/layouts/app/app-header-layout';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import ErrorBoundary from '@/components/error-boundary';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <ErrorBoundary>
        <AppHeaderLayout breadcrumbs={breadcrumbs} {...props}>
            {children}
        </AppHeaderLayout>
    </ErrorBoundary>
);
