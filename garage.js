import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';

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
    for (const w of walls) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(HALF * 2, HEIGHT), wallMat);
        m.position.set(...w.pos); m.rotation.y = w.rot; group.add(m);
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
    const SIGN_X = -10;
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
    sign.position.set(SIGN_X, 4.6, -HALF + 0.05); group.add(sign);
    drawSign();
    new THREE.TextureLoader().load(iconUrl, (icon) => { iconImg = icon.image; drawSign(); });
    function setScreen(content) { currentScreen = content; loadShots(content && content.images); drawSign(); }
    function setScreenPose(x, y, scale = 1) {   // y en monde ; null = position de repos
        const px = x == null ? SIGN_X : x, py = y == null ? 4.6 : y - group.position.y, sc = x == null ? 1 : scale;
        if (window.gsap) { window.gsap.to(sign.position, { x: px, y: py, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' }); window.gsap.to(sign.scale, { x: sc, y: sc, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto' }); }
        else { sign.position.set(px, py, sign.position.z); sign.scale.set(sc, sc, 1); }
    }

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
    for (const x of [-14, -12.6, -11.2, 11.2, 12.6, 14]) stacks.push([x, -HALF + 1.2]);
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
        group, envMap, shadow, setScreen, setScreenPose, screenCenter: new THREE.Vector3(SIGN_X, 4.6, -HALF),
        setFloorY(y) { group.position.y = y; },
        setVisible(v) { group.visible = v; }
    };
}
