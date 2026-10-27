import * as THREE from 'three';

// Avatar stylisé de Tanguy (debout, bras croisés, polo blanc CarZero).
// Construit en formes simples : léger à charger et facile à modifier.
// Unités : mètres. Le groupe est mis à l'échelle ensuite pour s'accorder à la voiture.
const GREEN = '#0F5C3A';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, envMapIntensity: 0.55, ...o });

// capsule entre deux points
function limb(a, b, r, material) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, len - 2 * r), 6, 16), material);
    m.position.copy(a).add(b).multiplyScalar(0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
    return m;
}
function ball(r, material, sx = 1, sy = 1, sz = 1, seg = 24) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(r, seg, Math.round(seg * 0.7)), material);
    m.scale.set(sx, sy, sz);
    return m;
}

export function createAvatar({ iconUrl = 'assets/carzero-icon.png', scale = 1.34 } = {}) {
    const root = new THREE.Group();          // position / orientation dans le garage
    const body = new THREE.Group();          // tout le personnage (mis à l'échelle)
    body.scale.setScalar(scale);
    root.add(body);

    const skin = mat('#dfae93', { roughness: 0.7 });
    const skinDark = mat('#cf9c82', { roughness: 0.7 });
    const hairM = mat('#5c3e28', { roughness: 0.9 });
    const hairL = mat('#6e4b31', { roughness: 0.9 });
    const polo = mat('#e9edec', { roughness: 0.9 });
    const trim = mat(GREEN, { roughness: 0.6 });
    const trousers = mat('#1e2328', { roughness: 0.8 });
    const shoe = mat('#e8e8e2', { roughness: 0.55 });
    const sole = mat('#bdbdb6', { roughness: 0.7 });

    // ---------- jambes + chaussures ----------
    for (const s of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.098, 0.88, 22), trousers);
        leg.position.set(s * 0.1, 0.5, 0); leg.rotation.z = s * 0.018; body.add(leg);
        const sh = limb(new THREE.Vector3(s * 0.108, 0.075, -0.045), new THREE.Vector3(s * 0.112, 0.075, 0.13), 0.064, shoe);
        sh.scale.set(1, 1, 1); body.add(sh);
        const so = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.026, 0.3), sole);
        so.position.set(s * 0.11, 0.012, 0.04); body.add(so);
    }
    const hips = ball(0.14, trousers, 1.3, 0.6, 0.85); hips.position.set(0, 0.93, 0); body.add(hips);

    // ---------- buste (respire) ----------
    const chest = new THREE.Group(); chest.position.set(0, 0.95, 0); body.add(chest);
    const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.15, 0.34, 8, 28), polo);
    torso.scale.set(1.42, 1, 0.8); torso.position.y = 0.27; chest.add(torso);
    const waist = new THREE.Mesh(new THREE.CylinderGeometry(0.168, 0.17, 0.03, 28), polo);   // bas du polo
    waist.scale.set(1.25, 1, 0.8); waist.position.y = -0.04; chest.add(waist);
    for (const s of [-1, 1]) { const sh = ball(0.07, polo, 1.05, 0.9, 1); sh.position.set(s * 0.2, 0.46, 0); chest.add(sh); }

    // col du polo + patte de boutonnage
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.072, 0.018, 10, 28), trim);
    collar.rotation.x = Math.PI / 2 - 0.25; collar.position.set(0, 0.57, 0.012); chest.add(collar);
    const placket = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.15, 0.008), polo);
    placket.position.set(0, 0.5, 0.112); placket.rotation.x = -0.12; chest.add(placket);
    for (const y of [0.53, 0.47]) { const b = ball(0.006, mat('#d9d9d2'), 1, 1, 0.6, 10); b.position.set(0, y, 0.118); chest.add(b); }
    // badge CarZero sur la poitrine (côté gauche du porteur)
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.058), new THREE.MeshBasicMaterial({ color: '#0F5C3A' }));
    badge.position.set(0.11, 0.4, 0.108); badge.rotation.y = 0.5; badge.rotation.x = -0.1; chest.add(badge);
    new THREE.TextureLoader().load(iconUrl, (t) => { badge.material.map = t; badge.material.color.set('#ffffff'); badge.material.needsUpdate = true; });

    // cou
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.058, 0.13, 18), skinDark);
    neck.position.set(0, 1.575, 0.005); body.add(neck);

    // ---------- bras croisés ----------
    const arm = (s) => {
        const sh = new THREE.Vector3(s * 0.225, 1.42, 0);
        const el = new THREE.Vector3(s * 0.245, 1.16, 0.08);
        const hand = new THREE.Vector3(-s * 0.115, s > 0 ? 1.285 : 1.225, s > 0 ? 0.165 : 0.185);
        body.add(limb(sh, el, 0.047, skin));
        // manche courte du polo + bord vert
        const sleeve = limb(sh.clone().lerp(el, -0.04), sh.clone().lerp(el, 0.5), 0.056, polo); body.add(sleeve);
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 20), trim);
        const cp = sh.clone().lerp(el, 0.5); cuff.position.copy(cp);
        cuff.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().subVectors(el, sh).normalize()); body.add(cuff);
        body.add(limb(el, hand, 0.041, skin));
        const e = ball(0.048, skin); e.position.copy(el); body.add(e);
        const h = ball(0.047, skin, 1.1, 0.9, 1); h.position.copy(hand); body.add(h);
    };
    arm(1); arm(-1);

    // ---------- tête ----------
    const head = new THREE.Group(); head.position.set(0, 1.69, 0.01); body.add(head);
    const skull = ball(1, skin, 0.098, 0.119, 0.108, 40); head.add(skull);
    const jaw = ball(1, skin, 0.088, 0.09, 0.098, 36); jaw.position.set(0, -0.045, 0.006); head.add(jaw);
    for (const s of [-1, 1]) {
        const ear = ball(0.024, skinDark, 0.5, 1, 0.8, 14); ear.position.set(s * 0.1, -0.005, -0.004); head.add(ear);
        // yeux : blanc, iris bleu-gris, pupille
        const w = ball(0.019, mat('#f2f2ef', { roughness: 0.3 }), 1, 0.8, 0.5, 14); w.position.set(s * 0.038, 0.016, 0.097); head.add(w);
        const iris = ball(0.0115, mat('#58788c', { roughness: 0.3 }), 1, 1, 0.5, 12); iris.position.set(s * 0.038, 0.016, 0.1045); head.add(iris);
        const pup = ball(0.005, mat('#101418', { roughness: 0.2 }), 1, 1, 0.5, 8); pup.position.set(s * 0.038, 0.016, 0.1075); head.add(pup);
        const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.0055, 0.04, 4, 8), mat('#5a3d28', { roughness: 0.9 }));
        brow.rotation.z = Math.PI / 2 + s * 0.1; brow.position.set(s * 0.04, 0.05, 0.094); head.add(brow);
    }
    const nose = ball(0.019, skinDark, 0.9, 1.2, 1.1, 14); nose.position.set(0, -0.012, 0.112); head.add(nose);
    // sourire
    const smile = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0038, 6, 24, Math.PI * 0.85), mat('#a35a52', { roughness: 0.5 }));
    smile.rotation.z = Math.PI + Math.PI * 0.05; smile.position.set(0, -0.05, 0.1); head.add(smile);
    
    // barbe courte : coque sombre sur le bas du visage + moustache
    const beard = new THREE.Mesh(new THREE.SphereGeometry(1, 36, 14, 0, Math.PI * 2, Math.PI * 0.56, Math.PI * 0.4),
        new THREE.MeshStandardMaterial({ color: '#8b6a53', roughness: 1, transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
    beard.scale.set(0.1, 0.122, 0.112); beard.position.set(0, -0.012, 0.002); head.add(beard);
    const stache = new THREE.Mesh(new THREE.TorusGeometry(0.026, 0.0065, 6, 16, Math.PI), new THREE.MeshStandardMaterial({ color: '#7a5a43', roughness: 1, transparent: true, opacity: 0.7 }));
    stache.rotation.z = 0; stache.scale.set(1.15, 0.55, 1); stache.position.set(0, -0.034, 0.108); head.add(stache);
    // cheveux courts, coiffés vers le haut
    const cap = new THREE.Mesh(new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, 0, Math.PI * 0.4), hairM);
    cap.scale.set(0.106, 0.128, 0.118); cap.position.set(0, 0.008, -0.006); cap.rotation.x = -0.16; head.add(cap);
    // mèche relevée sur le devant + volume sur le dessus
    const quiff = ball(1, hairL, 0.07, 0.04, 0.075, 24); quiff.position.set(0.004, 0.118, 0.045); quiff.rotation.x = -0.45; head.add(quiff);
    const top = ball(1, hairM, 0.08, 0.05, 0.085, 24); top.position.set(-0.004, 0.122, -0.005); head.add(top);
    const sideL = ball(1, hairM, 0.045, 0.05, 0.05, 16); sideL.position.set(-0.075, 0.07, 0.0); head.add(sideL);
    const sideR = ball(1, hairM, 0.045, 0.05, 0.05, 16); sideR.position.set(0.075, 0.07, 0.0); head.add(sideR);

    // ---------- zone de clic invisible (plus facile à viser) ----------
    const hit = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.95, 0.6), new THREE.MeshBasicMaterial({ visible: false }));
    hit.position.set(0, 0.97, 0); body.add(hit);

    // ---------- animation douce ----------
    const look = { x: 0, y: 0 };      // où regarde la tête (-1..1)
    let t = 0;
    function update(delta) {
        t += delta;
        const breath = Math.sin(t * 1.5);
        chest.scale.set(1 + breath * 0.004, 1 + breath * 0.007, 1 + breath * 0.006);
        head.rotation.y += (look.x * 0.45 - head.rotation.y) * Math.min(1, delta * 4);
        head.rotation.x += (look.y * 0.18 - 0.02 - head.rotation.x) * Math.min(1, delta * 4);
        head.position.y = 1.69 + breath * 0.0015;
    }
    function setLook(x, y) { look.x = Math.max(-1, Math.min(1, x)); look.y = Math.max(-1, Math.min(1, y)); }

    const pickable = [hit];
    body.traverse((o) => { if (o.isMesh) o.castShadow = false; });

    return { group: root, update, setLook, pickable, headHeight: 1.7 * scale, scale };
}
