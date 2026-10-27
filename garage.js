import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { createOutside, createMechanics } from './garage-life.js';

// Garage 3D aux couleurs de l'écurie CarZero.
// Le sol du garage est à y = 0 dans ce groupe : on le pose ensuite sous les roues avec setFloorY().
const GREEN = '#0F5C3A', GREEN_LIGHT = '#43B97F', DARK = '#0C1512';
const HALF = 16, HEIGHT = 9;

function canvasTex(w, h, draw, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
    return t;
}

export function createGarage({ renderer, reflections = true, iconUrl = 'assets/carzero-icon.png' }) {
    const group = new THREE.Group();
    group.name = 'garage';

    // ---------- sol : béton poli, quadrillage, boîte de stand peinte ----------
    const floorTex = canvasTex(2048, 2048, (g, w, h) => {
        g.fillStyle = '#0e1613'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 6000; i++) { g.fillStyle = `rgba(255,255,255,${Math.random() * 0.025})`; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
        const u = w / (HALF * 2);            // pixels par unité
        g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 2;
        for (let x = 0; x <= w; x += u * 2) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (let y = 0; y <= h; y += u * 2) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
        // boîte de stand autour de la voiture (5 de large sur 11 de long)
        const bw = 5.6 * u, bl = 11.6 * u, cx = w / 2, cy = h / 2;
        g.strokeStyle = '#2f8f63'; g.lineWidth = 7; g.strokeRect(cx - bw / 2, cy - bl / 2, bw, bl);
        g.strokeStyle = 'rgba(255,255,255,0.45)'; g.lineWidth = 3; g.strokeRect(cx - bw / 2 - 16, cy - bl / 2 - 16, bw + 32, bl + 32);
        // couloir de circulation des mécanos (lignes jaunes en pointillés)
        g.strokeStyle = 'rgba(255,205,60,0.5)'; g.lineWidth = 5; g.setLineDash([46, 34]);
        for (const [x0, z0, x1, z1] of [[-13.6, -13.4, 13.6, 8.8], [-11.2, -11, 11.2, 6.2]]) g.strokeRect((x0 + HALF) * u, (z0 + HALF) * u, (x1 - x0) * u, (z1 - z0) * u);
        g.setLineDash([]);
        // repères aux 4 coins
        g.fillStyle = '#2f8f63';
        for (const sx of [-1, 1]) for (const sy of [-1, 1]) g.fillRect(cx + sx * bw / 2 - 30, cy + sy * bl / 2 - 30, 60, 60);
    });
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.75, metalness: 0.2, envMapIntensity: 0.45 });
    if (reflections) { floorMat.transparent = true; floorMat.opacity = 0.84; floorMat.depthWrite = false; }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), floorMat);
    floor.rotation.x = -Math.PI / 2; floor.position.y = 0.004; floor.renderOrder = 1;
    group.add(floor);

    // ---------- murs ----------
    const wallTex = canvasTex(1024, 1024, (g, w, h) => {
        g.fillStyle = '#16231d'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#101a16'; g.fillRect(0, h - 190, w, 190);         // plinthe
        g.strokeStyle = 'rgba(0,0,0,0.55)'; g.lineWidth = 4;
        for (const x of [0, 512]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
        for (const y of [h - 190, 600, 0]) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
        g.strokeStyle = 'rgba(255,255,255,0.035)';
        for (const x of [4, 516]) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    }, [HALF * 2 / 6, HEIGHT / 6]);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.85, metalness: 0.05 });
    const walls = [
        { pos: [0, HEIGHT / 2, -HALF], rot: 0 },
        { pos: [0, HEIGHT / 2, HALF], rot: Math.PI },
        { pos: [-HALF, HEIGHT / 2, 0], rot: Math.PI / 2 },
        { pos: [HALF, HEIGHT / 2, 0], rot: -Math.PI / 2 }
    ];
    // murs de côté : percés de 3 fenêtres qui donnent sur la piste
    const WIN_Y0 = 2.5, WIN_Y1 = 6.3, WIN_W = 5.2, WIN_Z = [-8.5, 0, 8.5];
    const sideTex = wallTex.clone(); sideTex.repeat.set(1 / 6, 1 / 6); sideTex.needsUpdate = true;
    const sideMat = new THREE.MeshStandardMaterial({ map: sideTex, roughness: 0.85, metalness: 0.05 });
    function sideWallGeo() {
        const sh = new THREE.Shape(); sh.moveTo(-HALF, 0); sh.lineTo(HALF, 0); sh.lineTo(HALF, HEIGHT); sh.lineTo(-HALF, HEIGHT); sh.closePath();
        for (const z of WIN_Z) { const h = new THREE.Path(); h.moveTo(z - WIN_W / 2, WIN_Y0); h.lineTo(z - WIN_W / 2, WIN_Y1); h.lineTo(z + WIN_W / 2, WIN_Y1); h.lineTo(z + WIN_W / 2, WIN_Y0); h.closePath(); sh.holes.push(h); }
        return new THREE.ShapeGeometry(sh);
    }
    const sideGeo = sideWallGeo();
    for (const w of walls) {
        const side = Math.abs(w.pos[0]) > 1;
        const m = new THREE.Mesh(side ? sideGeo : new THREE.PlaneGeometry(HALF * 2, HEIGHT), side ? sideMat : wallMat);
        m.position.set(...w.pos); m.rotation.y = w.rot;
        if (side) { m.position.y = 0; m.rotation.y = w.rot; }
        group.add(m);
        // bande lumineuse verte le long du mur
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.5, 0.85) }));
        strip.position.set(...w.pos); strip.position.y = 1.75; strip.rotation.y = w.rot;
        strip.translateZ(0.02); group.add(strip);
    }

    // plafond + rampes lumineuses
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HALF * 2), new THREE.MeshStandardMaterial({ color: '#070c0a', roughness: 1 }));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = HEIGHT; group.add(ceil);
    const lampMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.25, 1.25, 1.25) });
    for (const x of [-10, -5, 0, 5, 10]) {
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, HALF * 1.8), lampMat);
        lamp.position.set(x, HEIGHT - 0.1, 0); group.add(lamp);
    }
    for (const z of [-11, 0, 11]) {      // poutres vertes en travers
        const b = new THREE.Mesh(new THREE.BoxGeometry(HALF * 2, 0.07, 0.07), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.4, 0.8) }));
        b.position.set(0, HEIGHT - 0.6, z); group.add(b);
    }

    // ---------- grande enseigne / écran CarZero (mur du fond) ----------
    // Au repos : l'enseigne. Quand on clique sur une boîte : un écran qui affiche la fiche (setScreen).
    const SIGN_X = 4, SIGN_Y = 4.5, SIGN_S = 1.2;   // l'écran ne bouge jamais
    let iconImg = null, currentScreen = null;
    const shots = new Map();   // captures d'écran de l'app (url -> image ou null si absente)
    function loadShots(list) { for (const u of list || []) if (!shots.has(u)) { shots.set(u, null); const im = new Image(); im.onload = () => { shots.set(u, im); drawSign(); }; im.src = u; } }
    const signTex = canvasTex(2048, 1024, () => {});
    signTex.encoding = THREE.LinearEncoding;
    const font = (w, px) => `${w} ${px}px "Segoe UI", Roboto, Arial, sans-serif`;
    function wrap(g, text, x, y, maxW, lh, maxLines) {
        const words = text.split(' '); let line = ''; let n = 0;
        for (const w of words) {
            const t = line ? line + ' ' + w : w;
            if (g.measureText(t).width > maxW && line) { g.fillText(line, x, y); y += lh; line = w; if (++n >= maxLines) return y; }
            else line = t;
        }
        if (line) { g.fillText(line, x, y); y += lh; }
        return y;
    }
    function drawSign() {
        const g = signTex.image.getContext('2d'), w = 2048, h = 1024;
        const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, GREEN); gr.addColorStop(1, '#0a3d27');
        g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 8; g.strokeRect(40, 40, w - 80, h - 80);
        g.textBaseline = 'alphabetic';
        const c = currentScreen;
        if (!c) {
            g.fillStyle = '#fff'; g.font = font(900, 250); g.fillText('CARZERO', 760, 560);
            g.fillStyle = GREEN_LIGHT; g.font = font(600, 56); g.fillText('M O T O R S P O R T   L O G I S T I C S', 770, 700);
            if (iconImg) g.drawImage(iconImg, 130, 190, 560, 560);
        } else {
            const imgs = (c.images || []).map(u => shots.get(u)).filter(Boolean);
            const X = 120, W = imgs.length ? 1250 : w - 240;
            if (iconImg) g.drawImage(iconImg, w - 250, 70, 120, 120);
            g.fillStyle = '#7dffc4'; g.font = font(700, 46); g.fillText(c.eyebrow.split('').join(' ').replace(/ {2,}/g, '   '), X, 140);
            g.fillStyle = '#fff'; g.font = font(900, 130); g.fillText(c.title, X, 290);
            g.fillStyle = '#cdeedd'; g.font = font(500, imgs.length ? 47 : 54); let y = wrap(g, c.hook, X, 375, W, 66, 2);
            // 3 chiffres clés
            y += 20; const cw = (W - 80) / 3;
            c.stats.forEach(([v, l], i) => {
                const x = X + i * (cw + 40);
                g.fillStyle = 'rgba(0,0,0,0.28)'; g.fillRect(x, y, cw, 215);
                g.fillStyle = '#43B97F'; g.fillRect(x, y, 8, 215);
                g.fillStyle = '#fff'; g.font = font(800, v.length > 10 ? 40 : 62); g.fillText(v, x + 32, y + 78);
                g.fillStyle = '#cdeedd'; g.font = font(500, 38); wrap(g, l, x + 32, y + 132, cw - 56, 46, 2);
            });
            y += 215 + 70;
            g.fillStyle = '#e8f5ee'; g.font = font(400, imgs.length ? 39 : 44); y = wrap(g, c.text, X, y, W, imgs.length ? 52 : 58, 4);
            g.fillStyle = GREEN_LIGHT; g.font = font(700, 40);
            g.fillText(c.tags.join('   ·   '), X, h - 70);
            if (imgs.length) {   // captures de l'app, façon téléphones, à droite
                const ph = 520, gap = 36; let px = w - 120;
                for (const im of imgs.slice(0, 2).reverse()) {
                    const pw = Math.min(330, ph * im.width / im.height);
                    px -= pw; const py = 250;
                    g.fillStyle = '#05100b'; g.beginPath(); g.roundRect(px - 12, py - 12, pw + 24, ph + 24, 34); g.fill();
                    g.save(); g.beginPath(); g.roundRect(px, py, pw, ph, 24); g.clip(); g.drawImage(im, px, py, pw, ph); g.restore();
                    px -= gap;
                }
            }
        }
        signTex.needsUpdate = true;
    }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(11, 5.5), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false }));
    sign.position.set(SIGN_X, SIGN_Y, -HALF + 0.05); sign.scale.setScalar(SIGN_S); group.add(sign);
    drawSign();
    new THREE.TextureLoader().load(iconUrl, (icon) => { iconImg = icon.image; drawSign(); });
    function setScreen(content) { currentScreen = content; loadShots(content && content.images); drawSign(); }
    function setScreenPose() { /* l'écran est fixe : plus rien à déplacer */ }

    // ---------- porte de garage (mur de devant) ----------
    const doorTex = canvasTex(512, 512, (g, w, h) => {
        g.fillStyle = '#26332d'; g.fillRect(0, 0, w, h);
        for (let y = 0; y < h; y += 32) { g.fillStyle = '#1b2721'; g.fillRect(0, y, w, 4); g.fillStyle = 'rgba(255,255,255,0.05)'; g.fillRect(0, y + 4, w, 2); }
    });
    const door = new THREE.Mesh(new THREE.PlaneGeometry(12, 6.4), new THREE.MeshStandardMaterial({ map: doorTex, roughness: 0.6, metalness: 0.4 }));
    door.position.set(0, 3.3, HALF - 0.05); door.rotation.y = Math.PI; group.add(door);

    // ---------- armoires à outils (murs de gauche et de droite) ----------
    const cabTex = canvasTex(256, 512, (g, w, h) => {
        g.fillStyle = '#1d2b25'; g.fillRect(0, 0, w, h);
        for (let i = 0; i < 6; i++) {
            const y = 20 + i * 80; g.fillStyle = '#25362f'; g.fillRect(14, y, w - 28, 68);
            g.fillStyle = GREEN_LIGHT; g.fillRect(w / 2 - 38, y + 28, 76, 8);
        }
    });
    const cabSide = new THREE.MeshStandardMaterial({ color: '#16211c', roughness: 0.7 });
    const cabFront = new THREE.MeshStandardMaterial({ map: cabTex, roughness: 0.55, metalness: 0.3 });
    const cabGeo = new THREE.BoxGeometry(0.9, 2.3, 1.6);
    for (const side of [-1, 1]) {
        for (let i = 0; i < 6; i++) {
            const z = -11 + i * 4.4;
            const cab = new THREE.Mesh(cabGeo, side < 0 ? [cabFront, cabSide, cabSide, cabSide, cabSide, cabSide] : [cabSide, cabFront, cabSide, cabSide, cabSide, cabSide]);
            cab.position.set(side * (HALF - 0.5), 1.15, z); group.add(cab);
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 1.7), new THREE.MeshStandardMaterial({ color: '#8a9690', metalness: 0.8, roughness: 0.35 }));
            top.position.set(side * (HALF - 0.5), 2.33, z); group.add(top);
        }
    }

    // ---------- piles de pneus (instanciées : un seul dessin) ----------
    const tyreGeo = new THREE.TorusGeometry(0.42, 0.2, 14, 28);
    const stacks = [];
    for (const x of [-14, -12.6, -11.2, 13, 14.4]) stacks.push([x, -HALF + 1.2]);
    for (const x of [-14.2, 14.2]) for (const z of [13, 11.6]) stacks.push([x, z]);
    const tyres = new THREE.InstancedMesh(tyreGeo, new THREE.MeshStandardMaterial({ color: '#0b0b0b', roughness: 0.9 }), stacks.length * 5);
    const rims = new THREE.InstancedMesh(new THREE.TorusGeometry(0.4, 0.025, 6, 28), new THREE.MeshBasicMaterial({ color: '#d9e4dd' }), stacks.length * 5);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
    let n = 0;
    for (const [x, z] of stacks) for (let k = 0; k < 5; k++) {
        m4.compose(new THREE.Vector3(x, 0.2 + k * 0.4, z), q, new THREE.Vector3(1, 1, 1)); tyres.setMatrixAt(n, m4);
        m4.compose(new THREE.Vector3(x, 0.2 + k * 0.4 + 0.2, z), q, new THREE.Vector3(1, 1, 1)); rims.setMatrixAt(n, m4); n++;
    }
    group.add(tyres, rims);

    // ---------- tache de lumière sous la voiture ----------
    const poolTex = canvasTex(256, 256, (g, w, h) => {
        const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
        r.addColorStop(0, 'rgba(90,230,160,0.10)'); r.addColorStop(0.5, 'rgba(40,160,110,0.035)'); r.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = r; g.fillRect(0, 0, w, h);
    });
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pool.rotation.x = -Math.PI / 2; pool.position.y = 0.012; pool.renderOrder = 2; group.add(pool);

    // ---------- reflets : on "photographie" le garage une fois, la voiture s'y reflète ----------
    const pmrem = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.add(group);
    const envMap = pmrem.fromScene(envScene, 0.035).texture;
    envScene.remove(group);
    pmrem.dispose();

    // ---------- déco : banderoles, établi, chariots ----------
    const banTex = canvasTex(256, 768, (g, w, h) => {
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, GREEN); gr.addColorStop(1, '#0a3d27'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
        g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
        g.fillStyle = '#fff'; g.font = '900 52px "Segoe UI", Arial, sans-serif'; g.save(); g.translate(w / 2 + 18, h - 70); g.rotate(-Math.PI / 2); g.fillText('CARZERO', 0, 0); g.restore();
        g.fillStyle = GREEN_LIGHT; g.fillRect(40, 70, 40, 40); g.fillRect(100, 70, 40, 40); g.fillRect(160, 70, 40, 40);
    });
    for (const x of [-9, -6.3, 6.3, 9]) {
        const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 4.5), new THREE.MeshStandardMaterial({ map: banTex, roughness: 0.8 }));
        b.position.set(x, 5.7, HALF - 0.08); b.rotation.y = Math.PI; group.add(b);
    }
    // établi + panneau à outils au fond à gauche
    const pegTex = canvasTex(512, 256, (g, w, h) => {
        g.fillStyle = '#1b2a24'; g.fillRect(0, 0, w, h);
        g.fillStyle = 'rgba(255,255,255,0.1)'; for (let x = 12; x < w; x += 24) for (let y = 12; y < h; y += 24) g.fillRect(x, y, 3, 3);
        const tools = [[40, '#c0392b', 90], [100, '#d9e4dd', 120], [160, GREEN_LIGHT, 80], [220, '#d9e4dd', 130], [280, '#e0a030', 100], [340, '#d9e4dd', 110], [400, '#c0392b', 90], [460, '#d9e4dd', 120]];
        for (const [x, c, l] of tools) { g.fillStyle = c; g.fillRect(x, 40, 16, l); g.fillRect(x - 6, 40, 28, 18); }
    });
    const bench = new THREE.Group(); bench.position.set(-6.2, 0, -HALF + 0.9);
    const steel = new THREE.MeshStandardMaterial({ color: '#8a9690', metalness: 0.8, roughness: 0.35 }), dk = new THREE.MeshStandardMaterial({ color: '#16211c', roughness: 0.7 });
    const benchTop = new THREE.Mesh(new THREE.BoxGeometry(5, 0.12, 1.3), steel); benchTop.position.y = 1.15; bench.add(benchTop);
    for (const sx of [-2.3, 2.3]) { const l = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.1, 1.1), dk); l.position.set(sx, 0.55, 0); bench.add(l); }
    const drawers = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, 1.15), new THREE.MeshStandardMaterial({ map: cabTex, roughness: 0.55, metalness: 0.3 })); drawers.position.set(1.4, 0.55, 0.05); bench.add(drawers);
    const peg = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.5), new THREE.MeshStandardMaterial({ map: pegTex, roughness: 0.8 })); peg.position.set(0, 2.9, -0.62); bench.add(peg);
    group.add(bench);
    // chariots à outils
    const trolleyGeo = new THREE.BoxGeometry(1.5, 1.3, 0.9), trolleyMat = new THREE.MeshStandardMaterial({ color: '#c0392b', roughness: 0.5, metalness: 0.4 });
    for (const [x, z, r] of [[-13.2, 9.4, 0.3], [13.0, -9.2, -0.4]]) { const t = new THREE.Mesh(trolleyGeo, trolleyMat); t.position.set(x, 0.75, z); t.rotation.y = r; group.add(t); const lid = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.06, 0.95), steel); lid.position.set(x, 1.43, z); lid.rotation.y = r; group.add(lid); }

    // ---------- fenêtres : cadres, vitres, taches de soleil ----------
    const frameMat = new THREE.MeshStandardMaterial({ color: '#10181a', metalness: 0.7, roughness: 0.4 });
    const glassMat = new THREE.MeshBasicMaterial({ color: '#cfe6f2', transparent: true, opacity: 0.07, depthWrite: false });
    const sunTex = canvasTex(128, 128, (g, w, h) => { const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(255,225,170,0.30)'); r.addColorStop(1, 'rgba(255,225,170,0)'); g.fillStyle = r; g.fillRect(0, 0, w, h); });
    for (const side of [-1, 1]) for (const z of WIN_Z) {
        const f = new THREE.Group(); f.position.set(side * HALF, 0, z); group.add(f);
        const bar = (w, h, d, x, y) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat); b.position.set(x, y, 0); f.add(b); };
        const cy = (WIN_Y0 + WIN_Y1) / 2, wh = WIN_Y1 - WIN_Y0;
        bar(0.35, 0.18, WIN_W + 0.3, 0, WIN_Y0); bar(0.35, 0.18, WIN_W + 0.3, 0, WIN_Y1);
        for (const dz of [-WIN_W / 2, 0, WIN_W / 2]) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.3, wh, 0.14), frameMat); v.position.set(0, cy, dz); f.add(v); }
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(WIN_W, wh), glassMat); gl.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; gl.position.set(0, cy, 0); f.add(gl);
        const glow = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.05, WIN_W), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.4, 0.8) })); glow.position.set(-side * 0.18, WIN_Y0 - 0.1, 0); f.add(glow);
        const sun = new THREE.Mesh(new THREE.PlaneGeometry(6, 9), new THREE.MeshBasicMaterial({ map: sunTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
        sun.rotation.x = -Math.PI / 2; sun.position.set(-side * 5, 0.015, 0); sun.renderOrder = 2; f.add(sun);
    }

    // ---------- dehors vivant : piste + voitures de course, et mécanos ----------
    const OUT_Y = 2.4;
    const outA = createOutside({ HALF, withSky: true });
    const outB = createOutside({ HALF, withSky: false }); outB.group.rotation.y = Math.PI;
    outA.group.position.y = outB.group.position.y = OUT_Y;   // la piste est à hauteur des fenêtres : on voit les voitures depuis le sol du garage
    group.add(outA.group, outB.group);
    const stackX = [-14, -12.6, -11.2, 13, 14.4];
    const mechs = createMechanics({ HALF, carAt: { x: 5.5, z: -0.3 }, tyreStacks: stackX, cabinetZ: [-11, -6.6, -2.2, 2.2, 6.6, 11] });
    group.add(mechs.group);
    function update(dt) { if (!group.visible) return; outA.update(dt); outB.update(dt); mechs.update(dt); }

    // ---------- miroir au sol (ordinateur seulement : il redessine la scène une 2e fois) ----------
    let mirror = null;
    if (reflections) {
        mirror = new Reflector(new THREE.PlaneGeometry(HALF * 2, HALF * 2), {
            color: 0x2c3431, textureWidth: Math.floor(window.innerWidth * 0.5), textureHeight: Math.floor(window.innerHeight * 0.5), clipBias: 0.003
        });
        mirror.rotation.x = -Math.PI / 2; mirror.position.y = 0.001;
        group.add(mirror);
    }

    // ombre douce sous la voiture : à ajouter au groupe de la voiture pour qu'elle tourne avec elle
    const shadowTex = canvasTex(256, 512, (g, w, h) => {
        const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, h / 2);
        r.addColorStop(0, 'rgba(0,0,0,0.85)'); r.addColorStop(0.55, 'rgba(0,0,0,0.45)'); r.addColorStop(1, 'rgba(0,0,0,0)');
        g.save(); g.translate(w / 2, h / 2); g.scale(w / h, 1); g.translate(-w / 2, -h / 2);
        g.fillStyle = r; g.fillRect(0, 0, w, h); g.restore();
    });
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 10.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2; shadow.renderOrder = 3;

    return {
        group, envMap, shadow, update, debug: { outA, outB, mechs }, setScreen, setScreenPose, screenCenter: new THREE.Vector3(SIGN_X, SIGN_Y + 1.2, -HALF),
        setFloorY(y) { group.position.y = y; },
        setVisible(v) { group.visible = v; }
    };
}
