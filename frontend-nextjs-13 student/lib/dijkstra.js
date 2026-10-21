// lib/dijkstra.js
//
// ⚠️ อ่านก่อนใช้: ฟังก์ชันนี้คำนวณเส้นทางจากกราฟถนน (nodes + edges) ซึ่งระบบปัจจุบัน
// "ยังไม่มีข้อมูล" ต้อง import ถนนจริงจาก OpenStreetMap (ผ่าน Overpass API หรือ osmnx)
// หรือจาก GISTDA มาเก็บลงตาราง road_nodes / road_edges ก่อน (ดู sql/schema-additions.sql)
// ไม่งั้น endpoint /api/route จะไม่มีกราฟให้เดินเลย — ปุ่ม "นำทางด้วย Google Maps"
// ที่ทำไว้ก่อนหน้านี้ยังเป็นทางเลือกที่ใช้งานได้จริงตอนนี้ ระหว่างรอข้อมูลถนน

export function buildGraph(edges) {
    const graph = new Map();
    for (const e of edges) {
        if (!graph.has(e.from_node_id)) graph.set(e.from_node_id, []);
        if (!graph.has(e.to_node_id)) graph.set(e.to_node_id, []);
        graph.get(e.from_node_id).push({ to: e.to_node_id, weight: e.weight });
        graph.get(e.to_node_id).push({ to: e.from_node_id, weight: e.weight }); // ถนนสองทาง
    }
    return graph;
}

export function dijkstra(graph, startId, endId) {
    const dist = new Map();
    const prev = new Map();
    const visited = new Set();
    const queue = new Set(graph.keys());

    for (const node of graph.keys()) dist.set(node, Infinity);
    if (!dist.has(startId)) return null;
    dist.set(startId, 0);

    while (queue.size) {
        let current = null;
        let best = Infinity;
        for (const node of queue) {
            if (dist.get(node) < best) {
                best = dist.get(node);
                current = node;
            }
        }
        if (current === null) break;
        queue.delete(current);
        visited.add(current);
        if (current === endId) break;

        for (const { to, weight } of graph.get(current) || []) {
            if (visited.has(to)) continue;
            const alt = dist.get(current) + weight;
            if (alt < dist.get(to)) {
                dist.set(to, alt);
                prev.set(to, current);
            }
        }
    }

    if (startId !== endId && !prev.has(endId)) return null; // ไม่มีเส้นทางไปถึง

    const path = [endId];
    let cur = endId;
    while (cur !== startId) {
        cur = prev.get(cur);
        if (cur === undefined) return null;
        path.unshift(cur);
    }
    return { path, distance: dist.get(endId) };
}

// เพิ่ม "โทษ" ให้ edge ที่ผ่านใกล้จุดน้ำท่วม เพื่อให้ Dijkstra เลี่ยงเองโดยธรรมชาติ
// แทนการตัดถนนทิ้งไปเลย (เผื่อไม่มีทางเลือกอื่นจริงๆ ก็ยังไปได้ แต่ไกลกว่า)
export function applyFloodPenalty(edges, floodPoints, penaltyRadiusM = 150, penaltyMultiplier = 20) {
    return edges.map((e) => {
        const nearFlood = floodPoints.some(
            (p) => haversine(e.mid_lat, e.mid_lng, p.latitude, p.longitude) <= penaltyRadiusM
        );
        return { ...e, weight: nearFlood ? e.distance_m * penaltyMultiplier : e.distance_m };
    });
}

function haversine(lat1, lng1, lat2, lng2) {
    const R = 6371000;
    const toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}