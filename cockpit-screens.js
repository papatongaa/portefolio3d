import * as THREE from 'three';

// Deux écrans 3D pour la vue cockpit (About Me).
// - Dans le cockpit : chaque écran est un objet 3D (coque incurvée + dalle) dont l'image est dessinée sur un <canvas>.
// - Au clic : la caméra plonge dans l'écran, puis la page s'affiche en vrai texte web (net à toutes les tailles).
// Le contenu des pages est défini UNE seule fois ci-dessous et sert aux deux affichages.

const W = 1024, H = 470;          // taille "logique" du dessin
const RES = 3;                    // résolution du canvas (3 = trois fois plus de pixels que W x H)
const ACCENT = '#00d2ff';
const X0 = 70;                    // marge intérieure
const FONT = '"Segoe UI", Roboto, Arial, sans-serif';

// ---------- CONTENU (à compléter / valider ensemble) ----------
// Types de blocs : label, big, sub, rule, text, hi (texte blanc), dim, small, bars, chips
const LEFT = {
    title: 'DRIVER // DATA',
    pages: [
        { name: 'Profile', blocks: [
            { t: 'big', s: 'Tanguy PAVAT' },
            { t: 'sub', s: 'Motorsport Management' },
            { t: 'rule' },
            { t: 'text', s: 'Master — International Sport Administration' },
            { t: 'dim', s: 'University of Lille (M2)' },
            { t: 'dim', s: 'Born in Austria · 23 countries visited' }
        ] },
        { name: 'Objective', blocks: [
            { t: 'label', s: 'LONG-TERM TARGET' },
            { t: 'big', s: 'Team Principal' },
            { t: 'rule' },
            { t: 'label', s: 'NEXT STEP' },
            { t: 'hi', s: 'End-of-studies internship in motorsport' },
            { t: 'dim', s: 'Available from February 2027 · 6 months' }
        ] },
        { name: 'Education', blocks: [
            { t: 'label', s: '2025 – NOW' },
            { t: 'hi', s: 'Master — International Sport Administration' },
            { t: 'small', s: 'University of Lille' },
            { t: 'rule' },
            { t: 'label', s: '2023 – 2025' },
            { t: 'hi', s: 'Double Bachelor — Economics & Management' },
            { t: 'small', s: 'and Applied Foreign Languages · Univ. Grenoble Alpes' },
            { t: 'small', s: 'Erasmus+ year at Vilnius University, Lithuania' }
        ] },
        { name: 'Involvement', blocks: [
            { t: 'label', s: 'STUDENT LIFE' },
            { t: 'hi', s: 'Class leader — Master International Sport Admin.' },
            { t: 'small', s: 'Student rep, Sports Council (SUAPS) · University of Lille' },
            { t: 'rule' },
            { t: 'label', s: 'MOTORSPORT VOLUNTEERING' },
            { t: 'hi', s: 'Circuit Paul Ricard · 2022 – 2023' },
            { t: 'small', s: 'Supporting the technical scrutineers' },
            { t: 'small', s: 'NoLimit4Life motorsport event · 2026' }
        ] },
        { name: 'Contact', blocks: [
            { t: 'label', s: 'EMAIL' },
            { t: 'big', s: 'tanguypavat8@gmail.com' },
            { t: 'rule' },
            { t: 'label', s: 'PHONE' },
            { t: 'hi', s: '+33 6 28 37 39 78' },
            { t: 'label', s: 'BASED IN' },
            { t: 'hi', s: 'Lille & Romans-sur-Isère, France' },
            { t: 'dim', s: 'Available from February 2027 · 6 months' }
        ] }
    ]
};

const RIGHT = {
    title: 'CAREER // TELEMETRY',
    pages: [
        { name: 'Skills', blocks: [
            // Niveaux décoratifs (à ajuster ensemble)
            { t: 'bars', items: [
                ['Logistics & planning', 0.9],
                ['Process automation', 0.85],
                ['App development', 0.75],
                ['Team coordination', 0.8],
                ['Data & reporting', 0.7]
            ] }
        ] },
        { name: 'Languages', blocks: [
            { t: 'bars', step: 76, items: [
                ['French', 1, 'native'],
                ['English', 0.85, 'fluent'],
                ['German', 0.55, 'conversational'],
                ['Lithuanian', 0.25, 'basic']
            ] }
        ] },
        { name: 'Tools', blocks: [
            { t: 'label', s: 'BUILT WITH' },
            { t: 'chips', items: ['Flutter', 'Supabase', 'Google Apps Script', 'Glide'] },
            { t: 'label', s: 'DAILY TOOLS' },
            { t: 'chips', items: ['Excel', 'Word', 'PowerPoint', 'Trello', 'Xero'] }
        ] }
    ]
};

// ---------- Dessin canvas (écran 3D dans le cockpit) ----------
function drawBlocks(c, blocks, t) {
    let y = 112;
    const txt = (s, size, color, bold = false) => {
        c.fillStyle = color; c.font = `${bold ? 'bold ' : ''}${size}px ${FONT}`; c.fillText(s, X0, y);
    };
    for (const b of blocks) {
        switch (b.t) {
            case 'label': y += 22; txt(b.s, 24, '#789'); y += 18; break;
            case 'big':   y += 44; txt(b.s, 58, ACCENT, true); y += 18; break;
            case 'sub':   y += 28; txt(b.s, 34, '#ffffff'); y += 22; break;
            case 'rule':  y += 6; c.fillStyle = 'rgba(0,210,255,0.35)'; c.fillRect(X0, y, W - 2 * X0, 2); y += 24; break;
            case 'text':  y += 30; txt(b.s, 30, '#cfd8dc'); y += 14; break;
            case 'hi':    y += 30; txt(b.s, 30, '#ffffff'); y += 14; break;
            case 'dim':   y += 28; txt(b.s, 28, '#99a7ad'); y += 12; break;
            case 'small': y += 24; txt(b.s, 24, '#99a7ad'); y += 10; break;
            case 'bars': {
                const step = b.step || 62;
                b.items.forEach(([label, v, right]) => {
                    y += 26; txt(label, 28, '#cfd8dc');
                    if (right) { c.fillStyle = '#789'; c.textAlign = 'right'; c.fillText(right, W - X0, y); c.textAlign = 'left'; }
                    c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(X0, y + 12, W - 2 * X0, 14);
                    c.fillStyle = ACCENT; c.fillRect(X0, y + 12, (W - 2 * X0) * v * Math.min(1, t * 1.5), 14);
                    y += step - 26;
                });
                break;
            }
            case 'chips': {
                y += 34; let x = X0;
                c.font = `26px ${FONT}`;
                b.items.forEach((s) => {
                    const w = c.measureText(s).width + 36;
                    if (x + w > W - X0) { x = X0; y += 58; }
                    c.fillStyle = 'rgba(0,210,255,0.12)'; c.fillRect(x, y - 30, w, 44);
                    c.strokeStyle = 'rgba(0,210,255,0.5)'; c.lineWidth = 2; c.strokeRect(x, y - 30, w, 44);
                    c.fillStyle = ACCENT; c.fillText(s, x + 18, y);
                    x += w + 14;
                });
                y += 36;
                break;
            }
        }
    }
}

// ---------- Version web (page plein écran) : même contenu, texte net ----------
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export function pageToHTML(blocks) {
    return blocks.map((b) => {
        switch (b.t) {
            case 'label': return `<div class="b-label">${esc(b.s)}</div>`;
            case 'big':   return `<h2 class="b-big">${esc(b.s)}</h2>`;
            case 'sub':   return `<div class="b-sub">${esc(b.s)}</div>`;
            case 'rule':  return `<hr class="b-rule">`;
            case 'text':  return `<p class="b-text">${esc(b.s)}</p>`;
            case 'hi':    return `<p class="b-hi">${esc(b.s)}</p>`;
            case 'dim':   return `<p class="b-dim">${esc(b.s)}</p>`;
            case 'small': return `<p class="b-small">${esc(b.s)}</p>`;
            case 'bars':  return `<div class="b-bars">${b.items.map(([l, v, r], i) =>
                `<div class="b-bar"><div class="b-bar-top"><span>${esc(l)}</span><span class="b-bar-right">${r ? esc(r) : ''}</span></div>` +
                `<div class="b-track"><div class="b-fill" style="--v:${v};--i:${i}"></div></div></div>`).join('')}</div>`;
            case 'chips': return `<div class="b-chips">${b.items.map((s) => `<span>${esc(s)}</span>`).join('')}</div>`;
            default: return '';
        }
    }).join('');
}

class CockpitScreen {
    constructor(def, maxAnisotropy) {
        this.def = def;
        this.page = 0;
        this.focused = false;
        this.canvas = document.createElement('canvas');
        this.canvas.width = W * RES; this.canvas.height = H * RES;
        this.ctx = this.canvas.getContext('2d');
        this.texture = new THREE.CanvasTexture(this.canvas);
        this.texture.anisotropy = maxAnisotropy;
        if (THREE.sRGBEncoding) this.texture.encoding = THREE.sRGBEncoding;
    }

    get pageCount() { return this.def.pages.length; }
    get pageName() { return this.def.pages[this.page].name; }
    get pageBlocks() { return this.def.pages[this.page].blocks; }
    get title() { return this.def.title; }
    setPage(i) { this.page = (i + this.pageCount) % this.pageCount; this.pageChanged = true; }

    draw(bootT, pageT) {
        const c = this.ctx;
        c.setTransform(RES, 0, 0, RES, 0, 0);
        c.clearRect(0, 0, W, H);
        c.fillStyle = '#04080c'; c.fillRect(0, 0, W, H);

        // Séquence de démarrage : trait lumineux → logo qui clignote → contenu
        if (bootT < 0.25) {
            const w = (W - 80) * (bootT / 0.25);
            c.fillStyle = ACCENT; c.fillRect((W - w) / 2, H / 2 - 1, w, 3);
        } else if (bootT < 0.55) {
            c.fillStyle = ACCENT; c.font = `bold 120px ${FONT}`; c.textAlign = 'center';
            c.globalAlpha = Math.random() > 0.35 ? 1 : 0.3;
            c.fillText('T.P', W / 2, H / 2 + 40);
            c.globalAlpha = 1; c.textAlign = 'left';
        } else {
            c.globalAlpha = Math.min(1, (bootT - 0.55) / 0.2);
            // bandeau
            c.fillStyle = 'rgba(0,210,255,0.12)'; c.fillRect(0, 0, W, 64);
            c.fillStyle = ACCENT; c.fillRect(0, 62, W, 3);
            c.fillStyle = '#9fb3bd'; c.font = `bold 26px ${FONT}`; c.fillText(this.def.title, X0, 42);
            // points de pagination
            this.def.pages.forEach((_, i) => {
                c.fillStyle = i === this.page ? ACCENT : 'rgba(255,255,255,0.2)';
                c.beginPath(); c.arc(W - X0 + 10 - (this.def.pages.length - 1 - i) * 28, 33, 8, 0, Math.PI * 2); c.fill();
            });
            drawBlocks(c, this.pageBlocks, pageT);
            // indication
            c.fillStyle = '#456'; c.font = `22px ${FONT}`;
            c.fillText('CLICK TO ENTER', X0, H - 22);
            c.globalAlpha = 1;
        }
        this.texture.needsUpdate = true;
    }
}

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

    let bootT = 0, pageT = 0, active = false, settled = false;
    const _q = new THREE.Quaternion();

    return {
        group,
        screens,
        show() { group.visible = true; active = true; settled = false; bootT = 0; pageT = 0; screens.forEach(s => { s.page = 0; s.focused = false; }); },
        hide() { group.visible = false; active = false; screens.forEach(s => s.focused = false); },
        isActive() { return active; },
        setFocused(screen) { screens.forEach(s => s.focused = (s === screen)); },
        update(delta) {
            if (!active) return;
            if (screens.some(s => s.pageChanged)) {
                screens.forEach(s => { s.pageChanged = false; });
                pageT = 0; settled = false;
            }
            if (settled) return;                       // rien ne bouge : on ne redessine pas
            bootT = Math.min(1.2, bootT + delta / 1.8);
            pageT += delta;
            screens.forEach(s => s.draw(bootT, Math.min(1, pageT / 1.2)));
            if (bootT >= 1 && pageT >= 1.2) settled = true;
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
            const dW = (SCREEN_W * 0.9) / (2 * tan * camera.aspect);
            const dH = (SCREEN_H * 0.9) / (2 * tan);
            const d = Math.max(Math.min(dW, dH), 0.16);
            return { position: center.clone().addScaledVector(normal, d), target: center };
        }
    };
}
