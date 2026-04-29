import { useState, useEffect } from 'react';

export function useGridLanes() {
    const [lanes, setLanes] = useState(7);

    useEffect(() => {
        const updateLanes = () => {
            const width = window.innerWidth;
            if (width >= 1536) setLanes(7);
            else if (width >= 1280) setLanes(6);
            else if (width >= 1024) setLanes(5);
            else if (width >= 768) setLanes(4);
            else if (width >= 640) setLanes(3);
            else setLanes(2);
        };

        updateLanes();
        window.addEventListener('resize', updateLanes);
        return () => window.removeEventListener('resize', updateLanes);
    }, []);

    return lanes;
}
