import * as THREE from 'three';
import { COUNTRIES, PLACES, ORIGIN } from './places.js';

const D2R = Math.PI / 180;
const AUTO_SPIN = 0.07;            // rad/s : le globe tourne doucement tout seul
const START_VIEW = { lon: -12, lat: 38 };

const COL = {
    ocean: '#050d18', land: '#11253b', border: 'rgba(150,205,255,0.30)', grid: 'rgba(120,180,230,0.07)',
    home: '#d7413d', work: '#00a9d6', visit: '#2b6c99'
};

// longitude / latitude (degrés) -> point sur la sphère (lon 0 / lat 0 regarde vers +Z)
function ll(lon, lat, r = 1) {
    const a = lon * D2R, b = lat * D2R;
    return new THREE.Vector3(r * Math.cos(b) * Math.sin(a), r * Math.sin(b), r * Math.cos(b) * Math.cos(a));
}

// Sphère (ou morceau de sphère) dont les UV suivent exactement longitude / latitude
function sphereGeo(r, wSeg, hSeg, lon0 = -180, lon1 = 180, lat0 = -90, lat1 = 90) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= hSeg; j++) {
        const v = j / hSeg, lat = lat1 - (lat1 - lat0) * v;
        for (let i = 0; i <= wSeg; i++) {
            const u = i / wSeg, lon = lon0 + (lon1 - lon0) * u;
            const p = ll(lon, lat, r);
            pos.push(p.x, p.y, p.z); uv.push(u, 1 - v);
        }
    }
    for (let j = 0; j < hSeg; j++) for (let i = 0; i < wSeg; i++) {
        const a = j * (wSeg + 1) + i, b = a + 1, c = a + wSeg + 1, d = c + 1;
        idx.push(a, c, b, b, c, d);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return g;
}

// Matériau : texture + léger assombrissement vers le bord + lueur bleue
function globeMaterial(tex, transparent) {
    return new THREE.ShaderMaterial({
        transparent, depthWrite: !transparent,
        uniforms: { map: { value: tex }, uOpacity: { value: 1 } },
        vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV;
            void main(){ vUv = uv; vN = normalize(normalMatrix * normal);
                vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = -mv.xyz; gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform sampler2D map; uniform float uOpacity; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
            void main(){ vec4 t = texture2D(map, vUv);
                float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
                vec3 c = t.rgb * (0.40 + 0.60 * pow(f, 0.45));
                c += vec3(0.0, 0.30, 0.55) * pow(1.0 - f, 3.0) * 0.45;
                gl_FragColor = vec4(c, t.a * uOpacity); }`
    });
}

function inRing(ring, x, y) {
    let c = false;
    for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const xi = ring[i], yi = ring[i + 1], xj = ring[j], yj = ring[j + 1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
    }
    return c;
}

// Dessine la carte dans un canvas. region = [lon0, lat0, lon1, lat1]
function drawMap(canvas, world, region, opts) {
    const ctx = canvas.getContext('2d');
    const [lon0, lat0, lon1, lat1] = region;
    const sx = canvas.width / (lon1 - lon0), sy = canvas.height / (lat1 - lat0);
    const X = (lon) => (lon - lon0) * sx, Y = (lat) => (lat1 - lat) * sy;
    ctx.fillStyle = COL.ocean; ctx.fillRect(0, 0, canvas.width, canvas.height);

    // quadrillage
    ctx.strokeStyle = COL.grid; ctx.lineWidth = opts.line * 0.8; ctx.beginPath();
    const step = opts.grid;
    for (let lo = Math.ceil(lon0 / step) * step; lo <= lon1; lo += step) { ctx.moveTo(X(lo), 0); ctx.lineTo(X(lo), canvas.height); }
    for (let la = Math.ceil(lat0 / step) * step; la <= lat1; la += step) { ctx.moveTo(0, Y(la)); ctx.lineTo(canvas.width, Y(la)); }
    ctx.stroke();

    const visible = world.filter((c) => c.bb[2] >= lon0 && c.bb[0] <= lon1 && c.bb[3] >= lat0 && c.bb[1] <= lat1);
    const path = (c) => {
        ctx.beginPath();
        for (const poly of c.p) for (const ring of poly) {
            ctx.moveTo(X(ring[0]), Y(ring[1]));
            for (let i = 2; i < ring.length; i += 2) ctx.lineTo(X(ring[i]), Y(ring[i + 1]));
            ctx.closePath();
        }
    };
    ctx.lineJoin = 'round';
    for (const c of visible) {
        path(c);
        const meta = COUNTRIES[c.i];
        ctx.fillStyle = meta ? COL[meta.kind] : COL.land;
        ctx.fill('evenodd');
    }
    ctx.strokeStyle = COL.border; ctx.lineWidth = opts.line;
    for (const c of visible) { path(c); ctx.stroke(); }
    // pays visités : contour plus net
    ctx.strokeStyle = 'rgba(210,240,255,0.55)'; ctx.lineWidth = opts.line * 1.25;
    for (const c of visible) if (COUNTRIES[c.i]) { path(c); ctx.stroke(); }
}

export function placeCardHTML(p) {
    return `
        <div class="m-eyebrow">${p.eyebrow}</div>
        <h2>${p.title}</h2>
        <p class="m-hook">${p.hook}</p>
        ${p.text ? `<p>${p.text}</p>` : ''}`;
}

export function createGlobe({ camera, canvas, maxAnisotropy = 1, maxTexture = 4096, onPlace }) {
    const root = new THREE.Group();   // ne tourne pas : sert à l'apparition
    const spin = new THREE.Group();   // tourne avec la souris
    root.add(spin);
    root.visible = false;

    const el = {
        ui: document.getElementById('globe-ui'),
        name: document.getElementById('g-name'),
        sub: document.getElementById('g-sub'),
        back: document.getElementById('g-back'),
        hint: document.getElementById('g-hint'),
        labels: document.getElementById('g-labels'),
        tip: document.getElementById('g-tip')
    };

    const S = { yaw: -START_VIEW.lon * D2R, pitch: START_VIEW.lat * D2R * 0.9, dist: 5, shift: 0 }; // état animé (shift = décalage en px quand la fiche est ouverte)
    let world = null, loading = null;
    let active = false, focusId = null, modalOpen = false;
    let globeMesh = null, patch = null, atmosphere = null;
    const arcs = [];
    const arcFade = { v: 1 };
    const drag = { on: false, moved: 0, x: 0, y: 0, vx: 0, vy: 0, id: -1, idle: 0 };
    const pinEls = new Map();
    const sz = { w: window.innerWidth, h: window.innerHeight };

    // ---------- distance de la caméra ----------
    function baseDistance() {
        const halfV = (camera.fov * D2R) / 2;
        const halfH = Math.atan(Math.tan(halfV) * (sz.w / sz.h));
        return 1 / Math.sin(Math.min(halfV, halfH) * 0.74);
    }

    // ---------- chargement des données + construction ----------
    function load() {
        if (loading) return loading;
        el.name.textContent = 'Loading map…';
        loading = import('./data/world.js').then((m) => {
            world = m.default;
            for (const c of world) {
                let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
                for (const poly of c.p) for (let i = 0; i < poly[0].length; i += 2) {
                    x0 = Math.min(x0, poly[0][i]); x1 = Math.max(x1, poly[0][i]);
                    y0 = Math.min(y0, poly[0][i + 1]); y1 = Math.max(y1, poly[0][i + 1]);
                }
                c.bb = [x0, y0, x1, y1];
            }
            build();
        });
        return loading;
    }

    function build() {
        const W = Math.min(4096, maxTexture), H = W / 2;
        const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
        drawMap(cv, world, [-180, -90, 180, 90], { line: W / 3200, grid: 15 });
        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = Math.min(8, maxAnisotropy);
        globeMesh = new THREE.Mesh(sphereGeo(1, 128, 64), globeMaterial(tex, false));
        spin.add(globeMesh);

        // halo autour du globe
        atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.14, 64, 48), new THREE.ShaderMaterial({
            transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
            vertexShader: `varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
            fragmentShader: `varying vec3 vN; void main(){ float i = pow(max(0.0, 0.62 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.0); gl_FragColor = vec4(0.0, 0.62, 1.0, 1.0) * i * 1.0; }`
        }));
        root.add(atmosphere);

        // arcs depuis l'Autriche
        const origin = ll(ORIGIN.lon, ORIGIN.lat);
        for (const p of PLACES.filter((q) => q.arc)) {
            const B = ll(p.lon, p.lat), ang = origin.angleTo(B), pts = [];
            for (let i = 0; i <= 64; i++) {
                const t = i / 64, s = Math.sin(ang);
                const q = origin.clone().multiplyScalar(Math.sin((1 - t) * ang) / s).add(B.clone().multiplyScalar(Math.sin(t * ang) / s));
                pts.push(q.normalize().multiplyScalar(1 + (0.035 + 0.2 * (ang / Math.PI)) * Math.sin(Math.PI * t)));
            }
            const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 96, 0.0032, 6, false);
            const mat = new THREE.MeshBasicMaterial({ color: 0x00d2ff, transparent: true, opacity: 0.9 });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.userData.total = geo.index.count;
            mesh.geometry.setDrawRange(0, 0);
            spin.add(mesh); arcs.push(mesh);
        }

        // épingles (boutons HTML, accessibles au clavier)
        for (const p of PLACES) {
            const b = document.createElement('button');
            b.className = `gpin gpin-${p.type} ${p.lab === 'l' || p.id === 'austria' ? 'lab-l' : ''}`;
            b.setAttribute('aria-label', `${p.name}: open details`);
            b.innerHTML = `<i></i><span>${p.name}</span>`;
            b.addEventListener('click', (e) => { e.stopPropagation(); onPlace && onPlace(p); });
            el.labels.appendChild(b);
            pinEls.set(p.id, { el: b, p, v: ll(p.lon, p.lat), shown: false });
        }
        el.name.textContent = 'Experience';
        if (active) revealArcs();
    }

    function revealArcs() {
        arcs.forEach((a, i) => {
            const o = { t: 0 };
            gsap.to(o, { t: 1, duration: 1.8, delay: 0.9 + i * 0.35, ease: 'power2.inOut',
                onUpdate: () => a.geometry.setDrawRange(0, Math.floor((o.t * 96)) * 36) });
        });
    }

    // ---------- entrée / sortie ----------
    function show() {
        active = true;
        root.visible = true;
        camera.near = 0.01; camera.updateProjectionMatrix();
        document.body.classList.add('globe-mode');
        el.ui.classList.remove('hidden');
        focusId = null; setFocusUI(null);
        const d = baseDistance();
        gsap.killTweensOf(S); gsap.killTweensOf(root.scale);
        S.dist = d * 1.9;
        root.scale.setScalar(0.7);
        gsap.to(S, { dist: d, duration: 2, ease: 'power3.out' });
        gsap.to(root.scale, { x: 1, y: 1, z: 1, duration: 1.6, ease: 'power3.out' });
        arcs.forEach((a) => a.geometry.setDrawRange(0, 0));
        arcFade.v = 1; arcs.forEach((a) => { a.material.opacity = 0.9; a.visible = true; });
        if (globeMesh) revealArcs(); else load();
        requestAnimationFrame(() => el.ui.classList.add('on'));
    }
    function hide() {
        if (!active) return;
        active = false;
        root.visible = false;
        camera.near = 0.1; camera.updateProjectionMatrix();
        document.body.classList.remove('globe-mode');
        camera.clearViewOffset(); S.shift = 0; modalOpen = false;
        el.ui.classList.remove('on');
        el.ui.classList.add('hidden');
        el.tip.classList.remove('on');
        canvas.style.cursor = '';
        gsap.killTweensOf(S);
        removePatch();
        focusId = null;
        pinEls.forEach((o) => { o.el.classList.remove('on'); o.shown = false; });
    }

    // ---------- zoom sur un pays ----------
    function visibleSize(box) {
        // taille (en radians de surface) que doit couvrir la vue pour que le pays en occupe ~62 %
        const lat0 = ((box[1] + box[3]) / 2) * D2R;
        const h = (box[3] - box[1]) * D2R;
        const w = (box[2] - box[0]) * D2R * Math.cos(lat0);
        const aspect = sz.w / sz.h;
        return Math.max(h, w / aspect) / 0.62;
    }

    function focusCountry(id) {
        const c = COUNTRIES[id];
        if (!c || !globeMesh) return;
        focusId = id;
        const [x0, y0, x1, y1] = c.box;
        const lon = (x0 + x1) / 2, lat = (y0 + y1) / 2;
        const vis = visibleSize(c.box);
        const tanV = Math.tan((camera.fov * D2R) / 2);
        const dist = Math.max(1.03, 1 + vis / (2 * tanV));

        let yaw = -lon * D2R;
        const TWO = Math.PI * 2;
        let dy = (yaw - S.yaw) % TWO; if (dy > Math.PI) dy -= TWO; if (dy < -Math.PI) dy += TWO;
        gsap.killTweensOf(S);
        gsap.to(S, { yaw: S.yaw + dy, pitch: Math.max(-1.3, Math.min(1.3, lat * D2R)), dist, duration: 1.7, ease: 'power2.inOut' });
        fadeArcs(0);
        setFocusUI(id);
        drag.vx = drag.vy = 0;
        buildPatch(id, lon, lat, vis);
    }

    // Les arcs disparaissent pendant le zoom sur un pays (vus de près, ils deviendraient énormes)
    function fadeArcs(to) {
        gsap.to(arcFade, { v: to, duration: 0.8, onUpdate: () => arcs.forEach((a) => { a.material.opacity = 0.9 * arcFade.v; a.visible = arcFade.v > 0.02; }) });
    }

    function backToWorld() {
        if (!focusId) return;
        focusId = null;
        setFocusUI(null);
        gsap.killTweensOf(S);
        gsap.to(S, { pitch: Math.max(0.2, Math.min(0.9, S.pitch)), dist: baseDistance(), duration: 1.5, ease: 'power2.inOut' });
        fadeArcs(1);
        if (patch) {
            const old = patch;
            patch = null;
            gsap.to(old.material.uniforms.uOpacity, { value: 0, duration: 0.6, onComplete: () => disposePatch(old) });
        }
    }

    function setFocusUI(id) {
        if (!id) {
            el.name.textContent = 'Experience';
            el.sub.textContent = 'Where the sport and the studies took me';
            el.back.classList.add('hidden');
            el.hint.textContent = 'Drag to rotate · click a highlighted country to zoom in';
            return;
        }
        const c = COUNTRIES[id];
        el.name.textContent = c.name;
        el.sub.textContent = c.note;
        el.back.classList.remove('hidden');
        const n = PLACES.filter((p) => p.country === id).length;
        el.hint.textContent = n ? 'Click a pin to see the story' : 'No pins here yet';
    }

    // Carte détaillée posée sur le globe, dans la zone du pays
    function buildPatch(id, lon, lat, vis) {
        removePatch();
        const aspect = sz.w / sz.h;
        const latSpan = Math.min(150, (vis / D2R) * 1.55);
        const lonSpan = Math.min(170, Math.max((latSpan * aspect) / Math.max(0.2, Math.cos(lat * D2R)), (COUNTRIES[id].box[2] - COUNTRIES[id].box[0]) * 1.8));
        const region = [lon - lonSpan / 2, Math.max(-88, lat - latSpan / 2), lon + lonSpan / 2, Math.min(88, lat + latSpan / 2)];
        const reqId = id;
        const MAX = Math.min(3072, maxTexture);
        const ppd = Math.min(MAX / (region[2] - region[0]), MAX / (region[3] - region[1]));
        const cv = document.createElement('canvas');
        cv.width = Math.max(64, Math.round((region[2] - region[0]) * ppd));
        cv.height = Math.max(64, Math.round((region[3] - region[1]) * ppd));
        const spanMax = Math.max(region[2] - region[0], region[3] - region[1]);
        drawMap(cv, world, region, { line: Math.max(1.6, Math.min(3.2, ppd / 14)), grid: spanMax > 40 ? 10 : spanMax > 12 ? 5 : spanMax > 4 ? 1 : 0.5 });
        // bords fondus : le morceau se raccorde au globe sans ligne visible
        const ctx = cv.getContext('2d');
        ctx.globalCompositeOperation = 'destination-in';
        const fx = 0.12, fy = 0.12;
        let g = ctx.createLinearGradient(0, 0, cv.width, 0);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fx, 'rgba(0,0,0,1)'); g.addColorStop(1 - fx, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
        g = ctx.createLinearGradient(0, 0, 0, cv.height);
        g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(fy, 'rgba(0,0,0,1)'); g.addColorStop(1 - fy, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);

        const tex = new THREE.CanvasTexture(cv);
        tex.anisotropy = Math.min(8, maxAnisotropy);
        const mat = globeMaterial(tex, true);
        mat.uniforms.uOpacity.value = 0;
        const wSeg = Math.min(96, Math.max(8, Math.ceil((region[2] - region[0]) / 1.5)));
        const hSeg = Math.min(96, Math.max(8, Math.ceil((region[3] - region[1]) / 1.5)));
        const mesh = new THREE.Mesh(sphereGeo(1.0012, wSeg, hSeg, region[0], region[2], region[1], region[3]), mat);
        mesh.renderOrder = 2;
        mesh.userData.id = reqId;
        patch = mesh; patch.material = mat;
        spin.add(mesh);
        gsap.to(mat.uniforms.uOpacity, { value: 1, duration: 1, delay: 0.5 });
    }
    function disposePatch(m) {
        spin.remove(m); m.geometry.dispose(); m.material.uniforms.map.value.dispose(); m.material.dispose();
    }
    function removePatch() { if (patch) { disposePatch(patch); patch = null; } }

    // ---------- clics et rotation à la souris / au doigt ----------
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const inv = new THREE.Quaternion();
    function pickCountry(e) {
        if (!world) return null;
        ndc.set((e.clientX / sz.w) * 2 - 1, -(e.clientY / sz.h) * 2 + 1);
        ray.setFromCamera(ndc, camera);
        const o = ray.ray.origin, d = ray.ray.direction;
        const b = o.dot(d), c = o.dot(o) - 1, disc = b * b - c;
        if (disc < 0) return null;
        const t = -b - Math.sqrt(disc);
        if (t < 0) return null;
        const p = o.clone().add(d.clone().multiplyScalar(t));
        inv.copy(spin.quaternion).invert();
        p.applyQuaternion(inv);
        const lon = Math.atan2(p.x, p.z) / D2R, lat = Math.asin(Math.max(-1, Math.min(1, p.y))) / D2R;
        for (const c2 of world) {
            if (!COUNTRIES[c2.i]) continue;
            if (lon < c2.bb[0] || lon > c2.bb[2] || lat < c2.bb[1] || lat > c2.bb[3]) continue;
            for (const poly of c2.p) {
                let n = 0; for (const r of poly) if (inRing(r, lon, lat)) n++;
                if (n % 2 === 1) return c2.i;
            }
        }
        // très petits pays / îles : on accepte un clic tout proche
        for (const c2 of world) {
            if (!COUNTRIES[c2.i]) continue;
            if (c2.bb[2] - c2.bb[0] > 3 || c2.bb[3] - c2.bb[1] > 3) continue;
            if (lon > c2.bb[0] - 1.2 && lon < c2.bb[2] + 1.2 && lat > c2.bb[1] - 1.2 && lat < c2.bb[3] + 1.2) return c2.i;
        }
        return null;
    }

    canvas.addEventListener('pointerdown', (e) => {
        if (!active) return;
        drag.on = true; drag.moved = 0; drag.x = e.clientX; drag.y = e.clientY; drag.vx = drag.vy = 0; drag.id = e.pointerId;
        try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    });
    canvas.addEventListener('pointermove', (e) => {
        if (!active) return;
        if (drag.on) {
            const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
            drag.x = e.clientX; drag.y = e.clientY;
            drag.moved += Math.abs(dx) + Math.abs(dy);
            if (!focusId && drag.moved > 4) {
                const k = (2 * (S.dist - 0.6) * Math.tan((camera.fov * D2R) / 2)) / sz.h;
                S.yaw += dx * k; S.pitch = Math.max(-1.3, Math.min(1.3, S.pitch + dy * k));
                drag.vx = dx * k * 60; drag.vy = dy * k * 60;
                canvas.style.cursor = 'grabbing';
                el.tip.classList.remove('on');
            }
            return;
        }
        const id = pickCountry(e);
        canvas.style.cursor = id ? 'pointer' : (focusId ? '' : 'grab');
        if (id && id !== focusId) {
            el.tip.textContent = COUNTRIES[id].name;
            el.tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 14}px)`;
            el.tip.classList.add('on');
        } else el.tip.classList.remove('on');
    });
    const endDrag = (e) => {
        if (!drag.on) return;
        drag.on = false;
        try { canvas.releasePointerCapture(drag.id); } catch (_) {}
        canvas.style.cursor = 'grab';
        if (drag.moved <= 5 && active) {
            const id = pickCountry(e);
            if (id && id !== focusId) focusCountry(id);
        }
    };
    canvas.addEventListener('pointerup', endDrag);
    canvas.addEventListener('pointercancel', () => { drag.on = false; });
    canvas.addEventListener('pointerleave', () => el.tip.classList.remove('on'));
    el.back.addEventListener('click', backToWorld);

    // ---------- à chaque image ----------
    const v = new THREE.Vector3(), camPos = new THREE.Vector3();
    function update(delta) {
        if (!active) return;
        if (!drag.on) {
            if (!focusId) {
                if (Math.abs(drag.vx) + Math.abs(drag.vy) > 0.001) {
                    S.yaw += drag.vx * delta; S.pitch = Math.max(-1.3, Math.min(1.3, S.pitch + drag.vy * delta));
                    const f = Math.pow(0.04, delta); drag.vx *= f; drag.vy *= f;
                } else if (!modalOpen) S.yaw += AUTO_SPIN * delta;
            }
        }
        spin.rotation.set(S.pitch, S.yaw, 0);
        spin.updateMatrixWorld(true);
        camera.position.set(0, 0, S.dist);
        // la fiche (tiroir de droite) recouvre une partie de l'écran : on décale le globe vers la gauche
        // (sur téléphone la fiche monte du bas : on décale vers le haut)
        if (S.shift > 0.003) {
            if (sz.w > 700) camera.setViewOffset(sz.w, sz.h, 275 * S.shift, 0, sz.w, sz.h);
            else camera.setViewOffset(sz.w, sz.h, 0, sz.h * 0.2 * S.shift, sz.w, sz.h);
        } else if (camera.view && camera.view.enabled) camera.clearViewOffset();

        // épingles : position écran + masquage derrière le globe
        camPos.set(0, 0, S.dist);
        const show = (o) => (focusId ? o.p.country === focusId : !!o.p.world);
        pinEls.forEach((o) => {
            v.copy(o.v).applyMatrix4(spin.matrixWorld);
            const n = v.clone().normalize();
            const facing = n.dot(camPos.clone().sub(v).normalize()) > 0.12;
            const on = !!(world && globeMesh) && show(o) && facing && root.scale.x > 0.95 && (!focusId || (patch && patch.material.uniforms.uOpacity.value > 0.6));
            if (on !== o.shown) { o.shown = on; o.el.classList.toggle('on', on); }
            if (on) {
                v.project(camera);
                // le nom passe à gauche de la pastille quand elle est près du bord droit de l'écran
                const left = o.p.id === 'austria' || (v.x * 0.5 + 0.5) * sz.w > sz.w * 0.62;
                if (left !== o.left) { o.left = left; o.el.classList.toggle('lab-l', left); }
                o.el.style.transform = `translate(${((v.x * 0.5 + 0.5) * sz.w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * sz.h).toFixed(1)}px)`;
            }
        });
    }

    function resize(w, h) {
        sz.w = w; sz.h = h;
        if (active && !focusId) { gsap.killTweensOf(S, 'dist'); S.dist = baseDistance(); }
    }

    return {
        group: root, load, show, hide, update, resize,
        back: backToWorld,
        focus: focusCountry,
        isActive: () => active,
        // position écran (px) d'un lieu : utile pour les tests
        project: (lon, lat) => { const q = ll(lon, lat).applyMatrix4(spin.matrixWorld).project(camera); return { x: (q.x * 0.5 + 0.5) * sz.w, y: (-q.y * 0.5 + 0.5) * sz.h }; },
        isFocused: () => !!focusId,
        setModalOpen: (b) => {
            modalOpen = b;
            gsap.to(S, { shift: b ? 1 : 0, duration: 0.6, ease: 'power2.out' });
        }
    };
}
