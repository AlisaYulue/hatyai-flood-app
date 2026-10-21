// component/EvacuationRoute.jsx
import { Polyline } from 'react-leaflet';

export default function EvacuationRoute({ coordinates }) {
    if (!coordinates?.length) return null;
    const positions = coordinates.map((c) => [c.latitude, c.longitude]);

    return (
        <>
            <Polyline
                positions={positions}
                pathOptions={{ color: '#2FBF83', weight: 5, opacity: 0.9, className: 'route-flow' }}
            />
            <style jsx global>{`
                .route-flow {
                    stroke-dasharray: 10 8;
                    animation: route-dash 1.2s linear infinite;
                }
                @media (prefers-reduced-motion: reduce) {
                    .route-flow { animation: none; }
                }
                @keyframes route-dash {
                    to { stroke-dashoffset: -18; }
                }
            `}</style>
        </>
    );
}