import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from './useNotification';

const SessionGuard: React.FC = () => {
    const navigate = useNavigate();
    const { showError } = useNotification();
    const originalFetch = useRef(window.fetch);
    const isIntercepted = useRef(false);

    useEffect(() => {
        // Prevent multiple interceptors
        if (isIntercepted.current) return;
        isIntercepted.current = true;

        const capturedFetch = originalFetch.current;

        window.fetch = async (...args) => {
            // Fix: explicit binding to window to prevent 'Illegal invocation'
            const response = await capturedFetch.apply(window, args as [RequestInfo | URL, RequestInit | undefined]);

            // Check for session expiry
            if (response.status === 401) {
                const url = args[0]?.toString() || '';
                const currentPath = window.location.pathname;

                // List of paths that should NEVER trigger a redirect to login
                const publicPaths = ['/login', '/forgot-password', '/reset-password', '/verify-2fa', '/unauthorized'];
                if (publicPaths.includes(currentPath)) {
                    return response;
                }

                // Ignore specific endpoints to prevent loops or unwanted redirects
                if (
                    !url.includes('/auth/login') &&
                    !url.includes('/auth/authorized-2fa') &&
                    !url.includes('/employee/dashboard/clock-in') &&
                    !url.includes('/auth/myData') &&
                    !url.includes('/auth/forgot-password') &&
                    !url.includes('/auth/reset-password')
                ) {
                    // Only show error for admin/super-admin paths, silent redirect for users
                    if (currentPath.startsWith('/admin') || currentPath.startsWith('/super-admin')) {
                        showError("Session expired. Please log in again.");
                    }

                    navigate('/login', { replace: true });
                    // Optionally return a fake response to prevent app crashes before nav
                    return response;
                }
            }

            return response;
        };

        // Cleanup
        return () => {
            window.fetch = capturedFetch;
            isIntercepted.current = false;
        };
    }, [navigate, showError]);

    return null; // This component handles side effects only
};

export default SessionGuard;
