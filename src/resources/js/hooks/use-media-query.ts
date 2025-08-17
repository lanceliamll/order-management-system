import { useEffect, useState } from 'react';

/**
 * Custom hook for responsive design using media queries
 * @param query The media query to check, e.g. "(min-width: 768px)"
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;
    
    // Create a media query list
    const mediaQuery = window.matchMedia(query);
    
    // Set the initial value
    setMatches(mediaQuery.matches);
    
    // Define the event listener
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    
    // Add the event listener
    mediaQuery.addEventListener('change', handleChange);
    
    // Clean up
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);
  
  return matches;
}
