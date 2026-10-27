import * as THREE from 'three';

// Les deux objets du garage qui accompagnent la voiture :
//  - le mini-globe (à gauche) -> Experience
//  - l'hologramme de Tanguy (au milieu) -> About me
// Le sol du garage est à y = 0 dans ce groupe ; on le pose avec setFloorY().
const GREEN = 0x2fcf8a, CYAN = 0x00d2ff;

export const HUB_POS = { globe: new THREE.Vector3(-5.6, 0, -0.5), me: new THREE.Vector3(0, 0, -1.2) };

function glowDisc(r, color, opacity) {
    const m = new THREE.Mesh(new THREE.RingGeometry(r * 0.82, r, 64), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
    m.rotation.x = -Math.PI / 2; return m;
}

function pedestal(r, h) {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.08, h, 48), new THREE.MeshStandardMaterial({ color: '#12201a', roughness: 0.5, metalness: 0.6 }));
    base.position.y = h / 2; g.add(base);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.05, 48), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 1.5, 0.85) }));
    top.position.y = h + 0.02; g.add(top);
    const ring = glowDisc(r * 1.55, GREEN, 0.7); ring.position.y = 0.02; g.add(ring);
    return g;
}

export function createHub({ globeTexture, photoUrl = 'photos/tanguy.jpg' }) {
    const group = new THREE.Group(); group.name = 'hub';

    // ---------- mini-globe ----------
    const globeRoot = new THREE.Group(); globeRoot.position.copy(HUB_POS.globe); group.add(globeRoot);
    globeRoot.add(pedestal(1.3, 1.15));
    const ball = new THREE.Group(); ball.position.y = 1.15 + 0.35 + 1.45; globeRoot.add(ball);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0x14324a });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.45, 64, 48), sphereMat);
    ball.add(sphere);
    // UV de la carte : longitude 0 au milieu -> on tourne la sphère pour que l'Europe soit visible au départ
    sphere.rotation.y = -Math.PI * 0.55;
    Promise.resolve(globeTexture).then((t) => { if (t) { sphereMat.map = t; sphereMat.color.set(0xffffff); sphereMat.needsUpdate = true; } });
    const halo = new THREE.Mesh(new THREE.SphereGeometry(1.62, 48, 32), new THREE.ShaderMaterial({
        transparent: true, side: THREE.BackSide, blending: THREE.AdditiveBlending, depthWrite: false,
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'varying vec3 vN; void main(){ float i = pow(max(0.0, 0.62 - dot(vN, vec3(0.0, 0.0, 1.0))), 3.0); gl_FragColor = vec4(0.0, 0.62, 1.0, 1.0) * i; }'
    }));
    ball.add(halo);
    const orbit = glowDisc(2.0, CYAN, 0.5); orbit.rotation.x = Math.PI / 2 - 0.35; ball.add(orbit);
    const globeHit = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 1.9, 4.2, 12), new THREE.MeshBasicMaterial({ visible: false }));
    globeHit.position.y = 2.1; globeRoot.add(globeHit);

    // ---------- hologramme de Tanguy ----------
    const meRoot = new THREE.Group(); meRoot.position.copy(HUB_POS.me); group.add(meRoot);
    meRoot.add(pedestal(1.0, 0.5));
    const holoMat = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { map: { value: null }, time: { value: 0 }, ready: { value: 0 } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `
            uniform sampler2D map; uniform float time; uniform float ready; varying vec2 vUv;
            void main(){
                vec4 t = texture2D(map, vUv);
                float lum = dot(t.rgb, vec3(0.3, 0.59, 0.11));
                vec3 holo = mix(t.rgb * vec3(0.75, 1.5, 1.1), vec3(0.2, 1.0, 0.65) * lum * 2.0, 0.35) * 1.25;
                float scan = 0.78 + 0.22 * sin(vUv.y * 260.0 - time * 3.0);
                float band = smoothstep(0.0, 0.04, abs(fract(vUv.y * 0.6 - time * 0.12) - 0.5) - 0.46) * 0.35;
                float a = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
                float flick = 0.93 + 0.07 * sin(time * 23.0) * sin(time * 7.0);
                gl_FragColor = vec4((holo + band) * scan * flick, a * ready);
            }`
    });
    new THREE.TextureLoader().load(photoUrl, (tex) => {
        tex.encoding = THREE.LinearEncoding;
        tex.repeat.set(0.56, 1); tex.offset.set(0.22, 0);   // coupe en portrait, visage au centre
        holoMat.uniforms.map.value = tex; holoMat.uniforms.ready.value = 1;
    });
    const holo = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 3.8), holoMat);
    holo.position.y = 0.5 + 0.35 + 1.9; meRoot.add(holo);
    // faisceau lumineux sous l'hologramme
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.0, 0.9, 40, 1, true), new THREE.MeshBasicMaterial({ color: GREEN, transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
    beam.position.y = 0.5 + 0.45; meRoot.add(beam);
    const meHit = new THREE.Mesh(new THREE.BoxGeometry(2.9, 4.6, 1.2), new THREE.MeshBasicMaterial({ visible: false }));
    meHit.position.y = 2.4; meRoot.add(meHit);

    let t = 0;
    function update(delta, camera) {
        t += delta;
        ball.rotation.y += delta * 0.18;
        orbit.rotation.z += delta * 0.25;
        holoMat.uniforms.time.value = t;
        holo.position.y = 0.5 + 0.35 + 1.9 + Math.sin(t * 1.3) * 0.05;
        // l'hologramme regarde toujours la caméra (rotation autour de l'axe vertical)
        if (camera) { const p = camera.position; holo.rotation.y = Math.atan2(p.x - (meRoot.position.x), p.z - (meRoot.position.z)); }
    }

    return {
        group, update, globeRoot, meRoot,
        pick: { globe: globeHit, me: meHit },
        setFloorY(y) { group.position.y = y; },
        setVisible(v) { group.visible = v; },
        // points au-dessus des objets (monde) pour placer les étiquettes
        labelPoint(which, out) {
            const root = which === 'globe' ? globeRoot : meRoot, h = which === 'globe' ? 4.5 : 5.2;
            return out.set(root.position.x, root.position.y + h, root.position.z).add(group.position);
        }
    };
}
