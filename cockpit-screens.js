import * as THREE from 'three';

// Deux écrans 3D dans le cockpit : des tableaux de bord animés (télémétrie), dessinés sur un <canvas>.
// Clic = la caméra plonge dans l'écran ; les flèches passent de l'un à l'autre.

const W = 1024, H = 470;          // taille "logique" du dessin
const RES = 2;                    // résolution du canvas (2 = deux fois plus de pixels que W x H)
const CY = '#00d2ff', GR = '#2fcf8a', AM = '#ffb020', DIM = '#6f8794', TXT = '#d6e3ea', BG = '#03070b';
const FONT = '"Segoe UI", Roboto, Arial, sans-serif';

// ---------- petits outils de dessin ----------
const font = (c, px, w = '') => { c.font = `${w} ${px}px ${FONT}`.trim(); };
const text = (c, s, x, y, color, px, w = '', align = 'left') => { c.fillStyle = color; font(c, px, w); c.textAlign = align; c.fillText(s, x, y); c.textAlign = 'left'; };
const panel = (c, x, y, w, h, title) => {
    c.fillStyle = 'rgba(0,210,255,0.045)'; c.fillRect(x, y, w, h);
    c.strokeStyle = 'rgba(0,210,255,0.28)'; c.lineWidth = 1.5; c.strokeRect(x, y, w, h);
    c.fillStyle = CY; c.fillRect(x, y, 22, 3);
    if (title) text(c, title, x + 14, y + 26, DIM, 16, 'bold');
};
const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);
// bruit doux pour les courbes de télémétrie
const wave = (x, seed) => Math.sin(x * 1.3 + seed) * 0.5 + Math.sin(x * 2.9 + seed * 2.1) * 0.3 + Math.sin(x * 0.7 + seed * 0.6) * 0.4;

function header(c, title, t, intro) {
    c.fillStyle = 'rgba(0,210,255,0.10)'; c.fillRect(0, 0, W, 54);
    c.fillStyle = CY; c.fillRect(0, 52, W * ease(intro * 1.6), 3);
    text(c, title, 28, 36, '#bfd3dc', 24, 'bold');
    // voyant "live" + chrono
    c.fillStyle = Math.floor(t * 1.6) % 2 ? GR : 'rgba(47,207,138,0.25)'; c.beginPath(); c.arc(W - 250, 28, 7, 0, 7); c.fill();
    text(c, 'LIVE', W - 236, 35, GR, 18, 'bold');
    const ms = Math.floor(t * 1000), mm = String(Math.floor(ms / 60000) % 60).padStart(2, '0'), ss = String(Math.floor(ms / 1000) % 60).padStart(2, '0'), cs = String(Math.floor(ms / 10) % 100).padStart(2, '0');
    text(c, `${mm}:${ss}.${cs}`, W - 28, 35, TXT, 22, 'bold', 'right');
}

// jauge circulaire
function ring(c, cx, cy, r, v, color, label, big, sub, t) {
    c.lineWidth = 14; c.strokeStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(cx, cy, r, 0.75 * Math.PI, 2.25 * Math.PI); c.stroke();
    c.strokeStyle = color; c.lineCap = 'round'; c.beginPath(); c.arc(cx, cy, r, 0.75 * Math.PI, (0.75 + 1.5 * v) * Math.PI); c.stroke(); c.lineCap = 'butt';
    // graduations
    c.lineWidth = 2; c.strokeStyle = 'rgba(255,255,255,0.25)';
    for (let i = 0; i <= 20; i++) { const a = (0.75 + 1.5 * i / 20) * Math.PI, r1 = r + 14, r2 = r + (i % 5 === 0 ? 24 : 19); c.beginPath(); c.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); c.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); c.stroke(); }
    text(c, big, cx, cy + 14, '#fff', 54, 'bold', 'center');
    text(c, label, cx, cy + 42, color, 17, 'bold', 'center');
    if (sub) text(c, sub, cx, cy + r + 40, DIM, 16, '', 'center');
}

// barre segmentée (comme l'usure des pneus)
function segBar(c, x, y, w, v, color, t, delay) {
    const n = 14, gap = 4, sw = (w - gap * (n - 1)) / n, k = ease(t * 1.4 - delay);
    for (let i = 0; i < n; i++) {
        const on = i < Math.round(n * v * k);
        c.fillStyle = on ? color : 'rgba(255,255,255,0.08)';
        c.globalAlpha = on ? 0.65 + 0.35 * Math.sin(t * 3 + i * 0.5) * 0.5 + 0.2 : 1;
        c.fillRect(x + i * (sw + gap), y, sw, 14);
    }
    c.globalAlpha = 1;
}

// circuit : un tracé fermé avec une voiture (point lumineux) qui tourne
const TRACK = (() => {
    const pts = [], N = 160;
    for (let i = 0; i < N; i++) {
        const a = i / N * Math.PI * 2;
        const r = 1 + 0.28 * Math.sin(2 * a + 0.6) + 0.16 * Math.sin(3 * a + 1.9) - 0.1 * Math.cos(5 * a);
        pts.push([Math.cos(a) * r * 1.25, Math.sin(a) * r * 0.85]);
    }
    return pts;
})();
function trackMap(c, cx, cy, sc, t, marks) {
    c.lineJoin = 'round'; c.lineWidth = 12; c.strokeStyle = 'rgba(255,255,255,0.10)'; c.beginPath();
    TRACK.forEach(([x, y], i) => i ? c.lineTo(cx + x * sc, cy + y * sc) : c.moveTo(cx + x * sc, cy + y * sc)); c.closePath(); c.stroke();
    c.lineWidth = 3; c.strokeStyle = 'rgba(0,210,255,0.55)'; c.stroke();
    const N = TRACK.length, head = (t * 0.18) % 1;
    // traînée
    for (let k = 0; k < 40; k++) {
        const i = Math.floor(((head - k * 0.004 + 1) % 1) * N), [x, y] = TRACK[i];
        c.fillStyle = `rgba(47,207,138,${0.5 * (1 - k / 40)})`; c.beginPath(); c.arc(cx + x * sc, cy + y * sc, 6 - k * 0.12, 0, 7); c.fill();
    }
    const [hx, hy] = TRACK[Math.floor(head * N) % N];
    c.fillStyle = '#fff'; c.shadowColor = GR; c.shadowBlur = 16; c.beginPath(); c.arc(cx + hx * sc, cy + hy * sc, 7, 0, 7); c.fill(); c.shadowBlur = 0;
    // étapes de parcours
    marks.forEach(([f, label, col, dx, dy]) => {
        const [x, y] = TRACK[Math.floor(f * N) % N];
        const px = cx + x * sc, py = cy + y * sc;
        c.fillStyle = BG; c.strokeStyle = col; c.lineWidth = 3; c.beginPath(); c.arc(px, py, 8, 0, 7); c.fill(); c.stroke();
        text(c, label, px + dx, py + dy, col, 17, 'bold', dx < 0 ? 'right' : 'left');
    });
}

// ---------- ÉCRAN GAUCHE : le pilote ----------
function drawLeft(c, t, intro) {
    header(c, 'DRIVER // DATA', t, intro);
    const a = (d) => { c.globalAlpha = ease(intro * 2 - d); };
    // identité
    a(0.1); text(c, 'TANGUY PAVAT', 28, 100, '#fff', 40, 'bold'); text(c, 'MOTORSPORT MANAGEMENT  ·  MASTER 2, UNIVERSITY OF LILLE', 28, 126, CY, 17, 'bold');
    // jauge pays
    a(0.2); panel(c, 24, 146, 250, 232, 'COUNTRIES');
    ring(c, 149, 258, 66, 0.77 * ease(intro * 1.5 - 0.3), CY, 'VISITED', '23', null, t);
    // langues
    a(0.35); panel(c, 290, 146, 356, 232, 'LANGUAGES');
    [['FRENCH', 1, 'NATIVE'], ['ENGLISH', 0.85, 'FLUENT'], ['GERMAN', 0.55, 'CONVERSATIONAL'], ['LITHUANIAN', 0.25, 'BASIC']].forEach(([n, v, l], i) => {
        const y = 188 + i * 46;
        text(c, n, 306, y, TXT, 20, 'bold'); text(c, l, 630, y, DIM, 15, '', 'right');
        segBar(c, 306, y + 10, 324, v, i === 0 ? GR : CY, intro, 0.4 + i * 0.1);
    });
    // circuit = parcours
    a(0.5); panel(c, 662, 146, 338, 232, 'CAREER LAP');
    trackMap(c, 832, 268, 78, t, [[0.02, '2019', GR, -14, -12], [0.25, '2023', CY, 14, 6], [0.5, '2026', CY, 12, 22], [0.78, 'NEXT', AM, -14, 6]]);
    // bas : objectif
    a(0.7); panel(c, 24, 392, 976, 62, null);
    text(c, 'NEXT STEP', 42, 421, DIM, 15, 'bold'); text(c, 'END-OF-STUDIES INTERNSHIP', 42, 444, '#fff', 20, 'bold');
    text(c, 'FROM FEBRUARY 2027  ·  6 MONTHS', 330, 444, AM, 18, 'bold');
    text(c, 'LONG-TERM TARGET', 700, 421, DIM, 15, 'bold'); text(c, 'TEAM PRINCIPAL', 700, 444, CY, 20, 'bold');
    c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(870, 432, 112, 8);
    c.fillStyle = CY; c.fillRect(870, 432, 112 * (0.35 + 0.05 * Math.sin(t)), 8);
    c.globalAlpha = 1;
}

// ---------- ÉCRAN DROIT : compétences + contact ----------
const SKILLS = [['LOGISTICS & PLANNING', 0.9, 1.3], ['PROCESS AUTOMATION', 0.85, 2.7], ['APP DEVELOPMENT', 0.75, 4.1], ['TEAM COORDINATION', 0.8, 5.3], ['DATA & REPORTING', 0.7, 6.9]];
const TOOLS = ['FLUTTER', 'SUPABASE', 'APPS SCRIPT', 'GLIDE', 'EXCEL', 'TRELLO', 'XERO'];
function drawRight(c, t, intro) {
    header(c, 'CAREER // TELEMETRY', t, intro);
    const a = (d) => { c.globalAlpha = ease(intro * 2 - d); };
    a(0.15); panel(c, 24, 72, 622, 318, 'SKILLS · LIVE TRACES');
    SKILLS.forEach(([n, v, seed], i) => {
        const y = 118 + i * 54, x0 = 250, w = 330, h = 40, k = ease(intro * 1.5 - 0.2 - i * 0.08);
        text(c, n, 42, y + 24, TXT, 17, 'bold');
        c.fillStyle = 'rgba(255,255,255,0.04)'; c.fillRect(x0, y, w, h);
        // courbe qui défile
        c.beginPath();
        for (let px = 0; px <= w; px += 4) {
            const f = wave(px * 0.045 + t * 1.6, seed) * 0.5 + 0.5, yy = y + h - (0.18 + 0.82 * (v * 0.6 + f * 0.4)) * h * k;
            px ? c.lineTo(x0 + px, yy) : c.moveTo(x0 + px, yy);
        }
        c.strokeStyle = i % 2 ? CY : GR; c.lineWidth = 2.2; c.stroke();
        c.lineTo(x0 + w, y + h); c.lineTo(x0, y + h); c.closePath(); c.fillStyle = i % 2 ? 'rgba(0,210,255,0.12)' : 'rgba(47,207,138,0.12)'; c.fill();
        // curseur de balayage
        const sx = x0 + ((t * 80 + i * 50) % w); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(sx, y, 2, h);
        text(c, String(Math.round(v * 100 * k)), 612, y + 27, '#fff', 24, 'bold', 'right');
    });
    // contact : "radio des stands"
    a(0.45); panel(c, 662, 72, 338, 318, 'PIT RADIO · CONTACT');
    // ondes radio animées
    for (let i = 0; i < 3; i++) { const r = 14 + ((t * 18 + i * 12) % 36); c.strokeStyle = `rgba(0,210,255,${0.5 - r / 100})`; c.lineWidth = 2; c.beginPath(); c.arc(960, 102, r, 0, 7); c.stroke(); }
    c.fillStyle = CY; c.beginPath(); c.arc(960, 102, 6, 0, 7); c.fill();
    text(c, 'EMAIL', 680, 126, DIM, 14, 'bold'); text(c, 'tanguypavat8@gmail.com', 680, 150, '#fff', 21, 'bold');
    text(c, 'PHONE', 680, 178, DIM, 14, 'bold'); text(c, '+33 6 28 37 39 78', 680, 203, '#fff', 22, 'bold');
    text(c, 'LINKEDIN', 680, 231, DIM, 14, 'bold'); text(c, 'linkedin.com/in/tanguy-pavat', 680, 255, '#fff', 20, 'bold');
    text(c, 'BASED IN', 680, 283, DIM, 14, 'bold'); text(c, 'Lille & Romans-sur-Isère, France', 680, 307, '#fff', 19, 'bold');
    text(c, 'AVAILABLE', 680, 336, DIM, 14, 'bold'); text(c, 'From February 2027 · 6 months', 680, 360, AM, 19, 'bold');
    // outils : bande défilante
    a(0.7); panel(c, 24, 400, 976, 54, null);
    text(c, 'TOOLS', 42, 434, DIM, 16, 'bold');
    c.save(); c.beginPath(); c.rect(120, 404, 872, 46); c.clip();
    const seg = TOOLS.join('   ·   ') + '   ·   ';
    font(c, 22, 'bold'); const sw = c.measureText(seg).width, off = (t * 60) % sw;
    c.fillStyle = CY; c.fillText(seg, 130 - off, 434); c.fillText(seg, 130 - off + sw, 434);
    c.restore();
    c.globalAlpha = 1;
}

class CockpitScreen {
    constructor(def, maxAnisotropy) {
        this.def = def;
        this.focused = false;
        this.canvas = document.createElement('canvas');
        this.canvas.width = W * RES; this.canvas.height = H * RES;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.anisotropy = maxAnisotropy;
        if (THREE.sRGBEncoding) this.texture.encoding = THREE.sRGBEncoding;
    }
    get title() { return this.def.title; }
    draw(bootT, t) {
        const c = this.ctx;
        c.setTransform(RES, 0, 0, RES, 0, 0);
        c.globalAlpha = 1; c.clearRect(0, 0, W, H);
        c.fillStyle = BG; c.fillRect(0, 0, W, H);
        if (bootT < 0.25) {            // démarrage : trait lumineux
            const w = (W - 80) * (bootT / 0.25);
            c.fillStyle = CY; c.fillRect((W - w) / 2, H / 2 - 1, w, 3);
        } else if (bootT < 0.5) {      // logo qui clignote
            c.fillStyle = CY; font(c, 120, 'bold'); c.textAlign = 'center';
            c.globalAlpha = Math.random() > 0.35 ? 1 : 0.3; c.fillText('T.P', W / 2, H / 2 + 40);
            c.globalAlpha = 1; c.textAlign = 'left';
        } else {
            this.def.draw(c, t, Math.min(1, (bootT - 0.5) / 0.5));
            // fines lignes de balayage
            c.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 4) c.fillRect(0, y, W, 1);
        }
        this.texture.needsUpdate = true;
    }
}

const LEFT = { title: 'DRIVER // DATA', draw: drawLeft };
const RIGHT = { title: 'CAREER // TELEMETRY', draw: drawRight };

export function createCockpitScreens({ maxAnisotropy = 8 } = {}) {
    const group = new THREE.Group();
    group.visible = false;

    const left = new CockpitScreen(LEFT, maxAnisotropy);
    const right = new CockpitScreen(RIGHT, maxAnisotropy);
    const screens = [left, right];
    const hitMeshes = [];

    const caseMat = new THREE.MeshStandardMaterial({ color: 0x0a0e12, metalness: 0.6, roughness: 0.45, side: THREE.DoubleSide });
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, side: THREE.DoubleSide });

    // --- Réglages de placement (modifiables) ---
    const SCREEN_W = 0.40;                    // largeur d'un écran
    const SCREEN_H = SCREEN_W * H / W;        // hauteur (suit le format de l'image)
    const CURVE_RADIUS = 0.40;                // rayon de courbure : plus petit = plus incurvé
    const INNER_X = 0.24;                     // distance de l'écran au centre : plus petit = plus près du pilier du halo
    const YAW = 0.60;                         // inclinaison vers le pilote (radians)
    const HEIGHT = 0.345;                     // hauteur
    const DEPTH = 0.32;                       // distance vers l'avant : plus petit = plus proche du pilote

    // Plan incurvé (écran de F1) : les bords se rapprochent du pilote
    function curvedPlane(w, h) {
        const g = new THREE.PlaneGeometry(w, h, 48, 1);
        const p = g.attributes.position;
        for (let i = 0; i < p.count; i++) {
            const x = p.getX(i);
            p.setZ(i, p.getZ(i) + (x * x) / (2 * CURVE_RADIUS));
        }
        g.computeVertexNormals();
        return g;
    }

    const placements = [
        { screen: left,  x:  INNER_X, yaw: Math.PI + YAW },
        { screen: right, x: -INNER_X, yaw: Math.PI - YAW }
    ];

    placements.forEach(({ screen, x, yaw }) => {
        const unit = new THREE.Group();
        unit.rotation.order = 'YXZ';   // évite que l'écran soit penché sur le côté
        unit.position.set(x, HEIGHT, DEPTH);
        unit.rotation.y = yaw;
        unit.rotation.x = -0.10;

        // coque incurvée derrière la dalle
        const shell = new THREE.Mesh(curvedPlane(SCREEN_W + 0.04, SCREEN_H + 0.04), caseMat);
        shell.position.z = -0.01;
        unit.add(shell);
        // liseré lumineux en haut
        const edge = new THREE.Mesh(curvedPlane(SCREEN_W + 0.04, 0.004), edgeMat);
        edge.position.set(0, (SCREEN_H + 0.04) / 2, -0.009);
        unit.add(edge);
        // dalle
        const plane = new THREE.Mesh(
            curvedPlane(SCREEN_W, SCREEN_H),
            new THREE.MeshBasicMaterial({ map: screen.texture, toneMapped: false, side: THREE.DoubleSide })
        );
        plane.userData.screen = screen;
        screen.plane = plane;
        unit.add(plane);
        hitMeshes.push(plane);
        // pied
        const stand = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.014, 0.18, 10), caseMat);
        stand.position.set(0, -(SCREEN_H / 2) - 0.08, -0.05);
        unit.add(stand);

        group.add(unit);
    });

    let bootT = 0, clock = 0, active = false, acc = 0;
    const _q = new THREE.Quaternion();

    return {
        group,
        screens,
        show() { group.visible = true; active = true; bootT = 0; clock = 0; screens.forEach(s => { s.focused = false; }); },
        hide() { group.visible = false; active = false; screens.forEach(s => s.focused = false); },
        isActive() { return active; },
        setFocused(screen) { screens.forEach(s => s.focused = (s === screen)); },
        update(delta) {
            if (!active) return;
            acc += delta; if (acc < 1 / 30) return;     // 30 images par seconde suffisent pour les écrans
            clock += acc; bootT = Math.min(1.5, bootT + acc / 1.6); acc = 0;
            screens.forEach(s => s.draw(bootT, clock));
        },
        // Écran touché par le rayon (ou null)
        pick(raycaster) {
            if (!active || bootT < 0.8) return null;
            const hit = raycaster.intersectObjects(hitMeshes, false)[0];
            return hit ? hit.object.userData.screen : null;
        },
        // Position de caméra "dans" l'écran : il déborde de la fenêtre dans les deux sens
        focusPose(screen, camera) {
            screen.plane.updateWorldMatrix(true, false);
            const center = new THREE.Vector3();
            screen.plane.getWorldPosition(center);
            const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(screen.plane.getWorldQuaternion(_q));
            if (normal.dot(camera.position.clone().sub(center)) < 0) normal.negate();
            const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
            const dW = (SCREEN_W * 1.55) / (2 * tan * camera.aspect);
            const dH = (SCREEN_H * 1.55) / (2 * tan);
            const d = Math.max(Math.min(dW, dH), 0.2);
            return { position: center.clone().addScaledVector(normal, d), target: center };
        }
    };
}
