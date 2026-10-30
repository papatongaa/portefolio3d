import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Le "dehors" du garage (piste, ciel, voitures de course qui passent) et les mécanos qui y circulent.
// Tout est fabriqué avec des formes simples : aucun fichier à télécharger.

function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
}
const rnd = (a, b) => a + Math.random() * (b - a);

/* ============================ DEHORS : ciel, piste, voitures ============================ */
export function createOutside({ HALF, withSky = true }) {
    const root = new THREE.Group(); root.name = 'outside';
    const LEN = 150;                       // demi-longueur de la piste (en z)

    // ciel : dégradé fin de fin d'après-midi
    const skyTex = canvasTex(8, 256, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h);
        gr.addColorStop(0, '#2f6f9c'); gr.addColorStop(0.45, '#79b6d6'); gr.addColorStop(0.495, '#f3d9a8'); gr.addColorStop(0.5, '#c9c4a0');
        gr.addColorStop(1, '#4f6a4a');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(190, 24, 16), new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide, fog: false, toneMapped: false, depthWrite: false }));
    sky.renderOrder = -10; if (withSky) root.add(sky);

    // collines lointaines (silhouette)
    const hillMat = new THREE.MeshBasicMaterial({ color: '#46705a', toneMapped: false });
    for (let i = 0; i < 9; i++) {
        const h = new THREE.Mesh(new THREE.SphereGeometry(rnd(16, 30), 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), hillMat);
        h.scale.y = rnd(0.45, 0.8);
        const a = -0.9 + i * 0.22; h.position.set(Math.cos(a) * 150 + 40, 0, Math.sin(a) * 150); root.add(h);
    }

    // sol : herbe
    const grassTex = canvasTex(256, 256, (g, w, h) => {
        g.fillStyle = '#4c7a43'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 1800; i++) { g.fillStyle = `rgba(${Math.random() < 0.5 ? '20,60,20' : '120,170,80'},${Math.random() * 0.18})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
    }, [30, 30]);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, LEN * 2), new THREE.MeshStandardMaterial({ map: grassTex, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.position.set(HALF + 130, -0.02, 0); root.add(ground);

    // voie des stands (juste devant les fenêtres)
    const asphaltTex = (stripe) => canvasTex(256, 512, (g, w, h) => {
        g.fillStyle = '#34383a'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        if (stripe) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.fillRect(8, 0, 6, h); g.fillRect(w - 14, 0, 6, h); }
        g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(w * 0.3, 0, w * 0.12, h); g.fillRect(w * 0.58, 0, w * 0.12, h);   // traces de gommes
    }, [1, LEN * 2 / 14]);
    const pit = new THREE.Mesh(new THREE.PlaneGeometry(5, LEN * 2), new THREE.MeshStandardMaterial({ map: asphaltTex(true), roughness: 0.9 }));
    pit.rotation.x = -Math.PI / 2; pit.position.set(HALF + 2.5, -0.01, 0); pit.material.map.repeat.set(1, LEN * 2 / 12); root.add(pit);

    // muret des stands
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, LEN * 2), new THREE.MeshStandardMaterial({ color: '#d7dcd8', roughness: 0.7 }));
    wall.position.set(HALF + 5.6, 0.225, 0); root.add(wall);
    const wallTop = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.1, LEN * 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.3, 0.8) }));
    wallTop.position.set(HALF + 5.6, 0.47, 0); root.add(wallTop);

    // la piste
    const TRACK_X = HALF + 14;             // axe de la piste
    const track = new THREE.Mesh(new THREE.PlaneGeometry(13, LEN * 2), new THREE.MeshStandardMaterial({ map: asphaltTex(false), roughness: 0.85 }));
    track.rotation.x = -Math.PI / 2; track.position.set(TRACK_X, -0.01, 0); track.material.map.repeat.set(1, LEN * 2 / 12); root.add(track);
    const kerbTex = canvasTex(32, 64, (g, w, h) => { g.fillStyle = '#e9e9e9'; g.fillRect(0, 0, w, h); g.fillStyle = '#d3302f'; g.fillRect(0, 0, w, h / 2); }, [1, LEN * 2 / 2]);
    for (const dx of [-7.2, 7.2]) {
        const k = new THREE.Mesh(new THREE.PlaneGeometry(1.4, LEN * 2), new THREE.MeshStandardMaterial({ map: kerbTex, roughness: 0.7 }));
        k.rotation.x = -Math.PI / 2; k.position.set(TRACK_X + dx, -0.005, 0); root.add(k);
    }
    // ligne de départ / arrivée
    const startTex = canvasTex(128, 32, (g, w, h) => { for (let x = 0; x < 16; x++) for (let y = 0; y < 4; y++) { g.fillStyle = (x + y) % 2 ? '#111' : '#f3f3f3'; g.fillRect(x * 8, y * 8, 8, 8); } });
    const start = new THREE.Mesh(new THREE.PlaneGeometry(13, 1.6), new THREE.MeshBasicMaterial({ map: startTex }));
    start.rotation.x = -Math.PI / 2; start.position.set(TRACK_X, 0.002, 4); root.add(start);

    // grillage de protection + poteaux, tribune, projecteurs
    const fenceTex = canvasTex(64, 64, (g, w, h) => {
        g.strokeStyle = 'rgba(210,225,220,0.75)'; g.lineWidth = 3;
        for (let i = -64; i < 128; i += 16) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 64, 64); g.stroke(); g.beginPath(); g.moveTo(i + 64, 0); g.lineTo(i, 64); g.stroke(); }
    }, [LEN * 2 / 4, 1]);
    const fence = new THREE.Mesh(new THREE.PlaneGeometry(LEN * 2, 4.2), new THREE.MeshBasicMaterial({ map: fenceTex, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    fence.rotation.y = Math.PI / 2; fence.position.set(TRACK_X + 9.5, 2.1, 0); root.add(fence);
    const postGeo = new THREE.BoxGeometry(0.16, 4.4, 0.16), postMat = new THREE.MeshStandardMaterial({ color: '#8d9692', metalness: 0.6, roughness: 0.4 });
    const posts = new THREE.InstancedMesh(postGeo, postMat, 76); const m4 = new THREE.Matrix4();
    for (let i = 0; i < 76; i++) { m4.makeTranslation(TRACK_X + 9.5, 2.2, -LEN + i * 4); posts.setMatrixAt(i, m4); }
    root.add(posts);

    const standTex = canvasTex(512, 128, (g, w, h) => {
        g.fillStyle = '#2b3a46'; g.fillRect(0, 0, w, h);
        const cols = ['#e8d2b0', '#c0392b', '#2e86c1', '#f1c40f', '#ecf0f1', '#16a085', '#8e44ad'];
        for (let y = 6; y < h; y += 9) for (let x = 4; x < w; x += 7) { if (Math.random() < 0.8) { g.fillStyle = cols[(Math.random() * cols.length) | 0]; g.fillRect(x, y, 4, 5); } }
    }, [10, 1]);
    for (const [z, len] of [[-40, 60], [48, 44]]) {
        for (let r = 0; r < 4; r++) {
            const step = new THREE.Mesh(new THREE.BoxGeometry(3, 1.6 + r * 1.4, len), new THREE.MeshStandardMaterial({ map: standTex, roughness: 0.9 }));
            step.material.map.repeat.set(len / 6, 1);
            step.position.set(TRACK_X + 15 + r * 3, (1.6 + r * 1.4) / 2, z); root.add(step);
        }
        const roof = new THREE.Mesh(new THREE.BoxGeometry(14, 0.3, len), new THREE.MeshStandardMaterial({ color: '#cfd6d3', roughness: 0.6 }));
        roof.position.set(TRACK_X + 20, 9.2, z); root.add(roof);
    }
    // haies d'arbres
    const treeMat = new THREE.MeshStandardMaterial({ color: '#2f5a33', roughness: 1 }), trunkMat = new THREE.MeshStandardMaterial({ color: '#4a3a2a' });
    for (let i = 0; i < 40; i++) {
        const t = new THREE.Group();
        const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 6), trunkMat); tr.position.y = 1.1; t.add(tr);
        const cr = new THREE.Mesh(new THREE.ConeGeometry(rnd(1.6, 2.6), rnd(4.5, 7), 8), treeMat); cr.position.y = 4.5; t.add(cr);
        t.position.set(TRACK_X + rnd(24, 60), 0, rnd(-LEN, LEN)); root.add(t);
    }

    // ----- voitures de course (formes simples) -----
    const dark = new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.8 });
    const carbon = new THREE.MeshStandardMaterial({ color: '#1b1f1e', roughness: 0.45, metalness: 0.4 });
    const wheelGeo = (r, w) => { const g = new THREE.CylinderGeometry(r, r, w, 16); g.rotateZ(Math.PI / 2); return g; };
    function makeRacer(color, accent) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.35 });
        const acc = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.4, metalness: 0.2 });
        const g = new THREE.Group();
        const add = (geo, m, x, y, z) => { const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); g.add(o); return o; };
        add(new THREE.BoxGeometry(0.95, 0.55, 3.3), mat, 0, 0.68, 0);                   // coque
        add(new THREE.BoxGeometry(0.5, 0.38, 2.4), mat, 0, 0.48, 2.7);                  // nez
        add(new THREE.BoxGeometry(0.7, 0.5, 2.4), mat, 0.95, 0.5, -0.1);                // pontons
        add(new THREE.BoxGeometry(0.7, 0.5, 2.4), mat, -0.95, 0.5, -0.1);
        add(new THREE.BoxGeometry(0.5, 0.8, 1.7), mat, 0, 0.95, -1.7);                  // capot moteur
        add(new THREE.BoxGeometry(0.08, 0.05, 3.3), acc, 0, 0.97, 0.1);                 // bandeau
        add(new THREE.BoxGeometry(2.9, 0.07, 0.75), carbon, 0, 0.18, 3.55);             // aile avant
        for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.3, 0.8), acc, sx * 1.47, 0.3, 3.55);
        add(new THREE.BoxGeometry(2.0, 0.08, 0.7), carbon, 0, 1.55, -3.1);              // aile arrière
        for (const sx of [-1, 1]) add(new THREE.BoxGeometry(0.07, 0.75, 0.9), acc, sx * 1.0, 1.25, -3.1);
        add(new THREE.BoxGeometry(0.12, 0.7, 0.3), carbon, 0, 1.2, -2.9);
        add(new THREE.SphereGeometry(0.2, 10, 8), acc, 0, 1.08, 0.35);                  // casque
        const halo = add(new THREE.TorusGeometry(0.34, 0.03, 6, 12, Math.PI), carbon, 0, 1.1, 0.45); halo.rotation.set(Math.PI / 2 - 0.35, 0, 0);
        const fw = wheelGeo(0.4, 0.5), rw = wheelGeo(0.44, 0.68);
        for (const sx of [-1, 1]) { add(fw, dark, sx * 1.15, 0.4, 2.35); add(rw, dark, sx * 1.15, 0.44, -2.2); }
        return g;
    }
    const liveries = [['#c8201e', '#f2f2f2'], ['#1b4fa0', '#ffd23a'], ['#f2f2f2', '#0f5c3a'], ['#f08a1c', '#202020'], ['#6a2a8a', '#43b97f']];
    const racers = [];
    for (let i = 0; i < 4; i++) {
        const [c, a] = liveries[i % liveries.length];
        const car = makeRacer(c, a); car.visible = false;
        root.add(car);
        racers.push({ obj: car, active: false, wait: rnd(2, 6 + i * 3), v: 0, dir: 1, lane: 0 });
    }
    function update(dt) {
        for (const r of racers) {
            if (!r.active) {
                r.wait -= dt;
                if (r.wait <= 0) {
                    r.active = true; r.dir = Math.random() < 0.5 ? 1 : -1; r.v = rnd(36, 58);
                    r.lane = rnd(-2.2, 2.2); r.z = -r.dir * (LEN - 20);
                    r.obj.rotation.y = r.dir > 0 ? 0 : Math.PI;
                    r.obj.position.set(TRACK_X + r.lane, 0, r.z);   // placée avant d'être affichée (sinon elle clignote au centre du garage)
                    r.obj.visible = true;
                }
            } else {
                r.z += r.dir * r.v * dt;
                r.obj.position.set(TRACK_X + r.lane, 0, r.z);
                if (Math.abs(r.z) > LEN - 10 && r.z * r.dir > 0) { r.active = false; r.obj.visible = false; r.wait = rnd(5, 14); }
            }
        }
    }
    return { group: root, update, racers };
}

/* ============================ MÉCANOS ============================ */
export function createMechanics({ HALF, carAt, tyreStacks, cabinetZ }) {
    const root = new THREE.Group(); root.name = 'mechanics';
    const shirt = new THREE.MeshStandardMaterial({ color: '#0F5C3A', roughness: 0.7 });
    const shirtLight = new THREE.MeshStandardMaterial({ color: '#43B97F', roughness: 0.7 });
    const pants = new THREE.MeshStandardMaterial({ color: '#1a1f1d', roughness: 0.8 });
    const skin = new THREE.MeshStandardMaterial({ color: '#d9a98a', roughness: 0.8 });
    const tyreMat = new THREE.MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.9 });
    const rimMat = new THREE.MeshBasicMaterial({ color: '#d9e4dd' });
    const boxMat = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.5, metalness: 0.3 });
    const limb = (w, h, d, mat) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(0, -h / 2, 0); return new THREE.Mesh(g, mat); };

    function makeMechanic(hue) {
        const body = new THREE.Group(); const m = new THREE.Group(); body.add(m);
        const hips = new THREE.Group(); hips.position.y = 0.9; m.add(hips);
        const legL = limb(0.2, 0.9, 0.22, pants); legL.position.x = -0.13; hips.add(legL);
        const legR = limb(0.2, 0.9, 0.22, pants); legR.position.x = 0.13; hips.add(legR);
        const torso = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.3), shirt); torso.position.y = 1.25; m.add(torso);
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.08, 0.31), shirtLight); stripe.position.y = 1.4; m.add(stripe);
        const shoulders = new THREE.Group(); shoulders.position.y = 1.55; m.add(shoulders);
        const armL = limb(0.16, 0.62, 0.17, shirt); armL.position.x = -0.37; shoulders.add(armL);
        const armR = limb(0.16, 0.62, 0.17, shirt); armR.position.x = 0.37; shoulders.add(armR);
        for (const a of [armL, armR]) { const h = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.14, 0.15), skin); h.position.y = -0.66; a.add(h); }
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 12, 10), skin); head.position.y = 1.83; m.add(head);
        const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), shirtLight); cap.position.y = 1.86; m.add(cap);
        const brim = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.2), shirtLight); brim.position.set(0, 1.86, 0.2); m.add(brim);
        // objets portés
        const tyre = new THREE.Group();
        const t1 = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.2, 10, 20), tyreMat); const t2 = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 20), rimMat);
        tyre.add(t1, t2); tyre.position.set(0, 1.0, 0.55); tyre.visible = false; m.add(tyre);
        const tool = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.3, 0.34), boxMat); tool.position.set(0, 0.95, 0.45); tool.visible = false; m.add(tool);
        body.scale.setScalar(1.2);
        body.userData = { m, legL, legR, armL, armR, tyre, tool, hips, shoulders, head };
        return body;
    }

    // version soignée, fabriquée dans Blender (assets/mechanic.glb) ; les cubes ci-dessus servent de secours
    function makeMechanicGlb(tpl) {
        const body = new THREE.Group(); const m = new THREE.Group(); body.add(m);
        const model = tpl.clone(true); m.add(model);
        const get = (n) => model.getObjectByName(n);
        // pneu tenu à deux mains devant la poitrine (les mains sont à ~1,24 m de haut, ~0,6 m devant)
        const tyre = new THREE.Group();
        tyre.add(new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.1, 10, 22), tyreMat), new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 6, 22), rimMat));
        tyre.position.set(0, 1.24, 0.66); tyre.visible = false; m.add(tyre);
        // caisse à outils tenue devant le ventre
        const tool = new THREE.Group();
        tool.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.3), boxMat));
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.025, 0.025), rimMat); handle.position.y = 0.13; tool.add(handle);
        tool.position.set(0, 1.07, 0.56); tool.visible = false; m.add(tool);
        body.scale.setScalar(1.3);
        body.userData = { m, legL: get('legL'), legR: get('legR'), armL: get('armL'), armR: get('armR'), tyre, tool };
        return body;
    }

    // ----- le circuit de promenade : deux "voies" qui font le tour du garage (on roule à droite : pas de croisement face à face) -----
    const X0 = -12.4, X1 = 12.4, Z0 = -12.2, Z1 = 6.6, LANE = 0.6;
    function ring(m) {          // m > 0 : voie extérieure ; m < 0 : voie intérieure
        const a = X0 - m, b = X1 + m, c = Z0 - m, d = Z1 + m, W = b - a, D = d - c, L = 2 * (W + D);
        return {
            W, D, L, corners: [0, W, W + D, 2 * W + D],
            point(s) {
                s = ((s % L) + L) % L;
                if (s < W) return [a + s, c];
                if (s < W + D) return [b, c + (s - W)];
                if (s < 2 * W + D) return [b - (s - W - D), d];
                return [a, d - (s - 2 * W - D)];
            },
            nearest(x, z) {
                const cx = Math.min(b, Math.max(a, x)), cz = Math.min(d, Math.max(c, z));
                const ds = [Math.abs(cz - c), Math.abs(cx - b), Math.abs(cz - d), Math.abs(cx - a)];
                const e = ds.indexOf(Math.min(...ds));
                if (e === 0) return cx - a;
                if (e === 1) return W + (cz - c);
                if (e === 2) return W + D + (b - cx);
                return 2 * W + D + (d - cz);
            }
        };
    }
    const RING0 = ring(0), LANE_IN = ring(-LANE), LANE_OUT = ring(LANE);
    function route(from, to) {
        const sA0 = RING0.nearest(from[0], from[1]), sB0 = RING0.nearest(to[0], to[1]);
        const fwd = ((sB0 - sA0) % RING0.L + RING0.L) % RING0.L, dir = fwd <= RING0.L / 2 ? 1 : -1;
        const g = dir > 0 ? LANE_IN : LANE_OUT;      // sens horaire : voie intérieure ; sens inverse : voie extérieure
        const sA = g.nearest(from[0], from[1]), sB = g.nearest(to[0], to[1]);
        const dist = dir > 0 ? ((sB - sA) % g.L + g.L) % g.L : ((sA - sB) % g.L + g.L) % g.L;
        const mid = [];
        for (const c of g.corners) {
            const off = dir > 0 ? ((c - sA) % g.L + g.L) % g.L : ((sA - c) % g.L + g.L) % g.L;
            if (off > 0.01 && off < dist - 0.01) mid.push([off, g.point(c)]);
        }
        mid.sort((x, y) => x[0] - y[0]);
        return [from, g.point(sA), ...mid.map((q) => q[1]), g.point(sB), to];
    }

    // ----- les lieux (chacun ne peut être pris que par un mécano à la fois) -----
    const mkSite = (x, z) => ({ p: [x, z], face: Math.atan2(carAt.x - x, carAt.z - z) });
    const siteFL = mkSite(-3.4, 4.6), siteFR = mkSite(3.4, 4.6), siteBL = mkSite(-3.4, -8.2), siteBR = mkSite(3.4, -8.2), siteE = mkSite(7.4, -5.0);
    const carSites = [siteFL, siteFR, siteBL, siteBR, siteE];
    const sitePairs = [[siteFL, siteFR], [siteBL, siteBR]];
    const tyreSpots = tyreStacks.map((x) => ({ p: [x, -HALF + 2.5], face: Math.PI }));
    const cabSpots = [];
    for (const side of [-1, 1]) for (const z of cabinetZ) cabSpots.push({ p: [side * (HALF - 2.2), z], face: side < 0 ? -Math.PI / 2 : Math.PI / 2 });
    const pick = (a) => a[(Math.random() * a.length) | 0];

    const mechs = [];
    const taken = (spot, me) => mechs.some((o) => o !== me && (o.hold.includes(spot) || Math.hypot(o.body.position.x - spot.p[0], o.body.position.z - spot.p[1]) < 2.4));
    const freeOf = (list, me) => list.filter((sp) => !taken(sp, me));

    function setPlan(mech, steps) { mech.steps = steps; mech.i = 0; mech.sub = 0; mech.timer = 0; mech.joined = false; }
    const here = (m) => [m.body.position.x, m.body.position.z];
    function fetchSteps(mech, src, kind, site, extra) {
        return [
            { t: 'walk', pts: route(here(mech), src.p) }, { t: 'face', a: src.face }, { t: 'reach', d: 1.4 }, { t: 'carry', what: kind },
            { t: 'walk', pts: route(src.p, site.p) }, { t: 'face', a: site.face }, ...extra
        ];
    }
    function planTask(mech) {
        mech.hold = [];
        const others = mechs.filter((o) => o !== mech);
        // une fois sur deux, deux mécanos travaillent ensemble : l'un amène un pneu, l'autre les outils
        const mate = others.find((o) => o.steps[o.i] && o.steps[o.i].t === 'idle' && o.i === 0 && !o.joined);
        const pairs = sitePairs.filter((pr) => pr.every((sp) => !taken(sp, mech)));
        const tys = freeOf(tyreSpots, mech), cabs = freeOf(cabSpots, mech);
        if (mate && pairs.length && tys.length && cabs.length && Math.random() < 0.5) {
            const pr = pick(pairs), ty = pick(tys), cb = pick(cabs), grp = { n: 0 }, workT = rnd(3.5, 6);
            const mk = (who, src, kind, site) => {
                setPlan(who, [{ t: 'idle', d: rnd(0.3, 1.2) }, ...fetchSteps(who, src, kind, site, [{ t: 'sync', g: grp }, { t: 'work', d: workT }, { t: 'carry', what: null }, { t: 'idle', d: rnd(0.5, 1.5) }])]);
                who.hold = [src, site];
            };
            mk(mech, ty, 'tyre', pr[0]); mk(mate, cb, 'tool', pr[1]);
            return;
        }
        const kind = Math.random() < 0.55 ? 'tyre' : 'tool';
        const srcs = kind === 'tyre' ? tys : cabs, sites = freeOf(carSites, mech);
        if (!srcs.length || !sites.length) { setPlan(mech, [{ t: 'idle', d: rnd(1.5, 3) }]); return; }
        const src = pick(srcs), site = pick(sites);
        mech.hold = [src, site];
        setPlan(mech, [{ t: 'idle', d: rnd(0.5, 3) }, ...fetchSteps(mech, src, kind, site, [{ t: 'work', d: rnd(3, 5.5) }, { t: 'carry', what: null }, { t: 'idle', d: rnd(0.5, 1.5) }])]);
    }

    for (let k = 0; k < 3; k++) {
        const body = makeMechanic(k);
        const g = LANE_IN, start = g.point(k * g.L / 3 + 4);
        body.position.set(start[0], 0, start[1]);
        root.add(body);
        mechs.push({ body, steps: [], i: 0, sub: 0, timer: 0, phase: 0, yaw: 0, carry: null, speed: rnd(2.5, 3.0), hold: [], idx: k, wait: 0, joined: false });
    }
    mechs.forEach(planTask);

    // dès que le modèle Blender est chargé, chaque mécano change de corps sans perdre sa place ni sa tâche
    new GLTFLoader().load('assets/mechanic.glb', (gltf) => {
        for (const mech of mechs) {
            const old = mech.body, nb = makeMechanicGlb(gltf.scene);
            nb.position.copy(old.position); nb.rotation.copy(old.rotation);
            root.remove(old); root.add(nb); mech.body = nb;
        }
    }, undefined, () => { /* pas de fichier : on garde les cubes */ });
    const angDiff = (a, b) => { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; };

    function update(dt) {
        for (const mech of mechs) {
            const u = mech.body.userData; let walking = false, mode = 'idle';
            const st = mech.steps[mech.i];
            if (!st) { planTask(mech); continue; }
            const next = () => { mech.i++; mech.sub = 0; mech.timer = 0; };
            if (st.t === 'idle') { mech.timer += dt; if (mech.timer > st.d) next(); }
            else if (st.t === 'walk') {
                const tgt = st.pts[mech.sub + 1];
                if (!tgt) next();
                else {
                    const p = mech.body.position; const dx = tgt[0] - p.x, dz = tgt[1] - p.z; const dist = Math.hypot(dx, dz), step = mech.speed * dt;
                    const fx = dx / (dist || 1), fz = dz / (dist || 1);
                    // quelqu'un juste devant ? on s'arrête, puis on le contourne si ça dure
                    let blocked = false;
                    for (const o of mechs) if (o !== mech) {
                        const ox = o.body.position.x - p.x, oz = o.body.position.z - p.z;
                        if (ox * ox + oz * oz < 1.5 * 1.5 && ox * fx + oz * fz > 0) blocked = true;
                    }
                    mech.wait = blocked ? mech.wait + dt : 0;
                    if (blocked && mech.wait < 1.0) { /* il attend */ }
                    else {
                        let mx = fx, mz = fz;
                        if (blocked) { mx = fx * 0.55 - fz * 0.83; mz = fz * 0.55 + fx * 0.83; }   // contournement par la droite
                        if (!blocked && dist <= step) { p.x = tgt[0]; p.z = tgt[1]; mech.sub++; }
                        else { p.x += mx * step; p.z += mz * step; mech.yaw += angDiff(mech.yaw, Math.atan2(mx, mz)) * Math.min(1, dt * 8); }
                        walking = true;
                    }
                }
            }
            else if (st.t === 'face') { mech.yaw += angDiff(mech.yaw, st.a) * Math.min(1, dt * 7); mech.timer += dt; if (mech.timer > 0.5) next(); }
            else if (st.t === 'reach') { mech.timer += dt; mode = 'reach'; if (mech.timer > st.d) next(); }
            else if (st.t === 'work') { mech.timer += dt; mode = 'work'; if (mech.timer > st.d) next(); }
            else if (st.t === 'sync') {      // on attend l'autre mécano avant de commencer ensemble
                if (!mech.joined) { st.g.n++; mech.joined = true; }
                mech.timer += dt;
                if (st.g.n >= 2 || mech.timer > 25) { mech.joined = false; next(); }
            }
            else if (st.t === 'carry') { mech.carry = st.what; next(); }

            // animation
            if (walking) mech.phase += dt * mech.speed * 3.1;
            const sw = walking ? Math.sin(mech.phase) : 0;
            const k = Math.min(1, dt * 10);
            const carrying = !!mech.carry;
            u.legL.rotation.x += (sw * 0.7 - u.legL.rotation.x) * k;
            u.legR.rotation.x += (-sw * 0.7 - u.legR.rotation.x) * k;
            let armA = walking ? -sw * 0.6 : 0, armB = walking ? sw * 0.6 : 0;
            if (carrying) { armA = armB = mech.carry === 'tyre' ? -1.25 : -0.95; }       // les mains se posent sur l'objet
            if (mode === 'reach') { armA = armB = -1.5 + Math.sin(mech.timer * 6) * 0.1; }
            if (mode === 'work') { const base = carrying ? (mech.carry === 'tyre' ? -1.25 : -0.95) : -1.0; armA = base + Math.sin(mech.timer * 7) * 0.12; armB = base + Math.cos(mech.timer * 5) * 0.1; }
            u.armL.rotation.x += (armA - u.armL.rotation.x) * k;
            u.armR.rotation.x += (armB - u.armR.rotation.x) * k;
            const lean = mode === 'work' ? 0.35 : mode === 'reach' ? 0.15 : 0;
            u.m.rotation.x += (lean - u.m.rotation.x) * k;
            u.m.position.y = walking ? Math.abs(Math.sin(mech.phase)) * 0.05 : 0;
            u.tyre.visible = mech.carry === 'tyre'; u.tool.visible = mech.carry === 'tool';
            mech.body.rotation.y = mech.yaw;
        }
        // jamais l'un dans l'autre : si deux mécanos se touchent, on les écarte doucement
        for (let i = 0; i < mechs.length; i++) for (let j = i + 1; j < mechs.length; j++) {
            const a = mechs[i].body.position, b = mechs[j].body.position;
            const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz) || 0.001, MIN = 0.9;
            if (d < MIN) { const push = (MIN - d) * 0.5 * Math.min(1, dt * 12), nx = dx / d, nz = dz / d; a.x -= nx * push; a.z -= nz * push; b.x += nx * push; b.z += nz * push; }
        }
    }
    return { group: root, update, mechs };
}
