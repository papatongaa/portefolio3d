import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { createCockpitScreens, pageToHTML } from './cockpit-screens.js';
import { panelsData, meCard, screenData } from './content.js';
import { createGlobe, placeCardHTML } from './globe.js';
import { createGarage } from './garage.js';
import { createAvatar } from './avatar.js';

// Chemins des modèles (en minuscules : les serveurs web, eux, font la différence entre "Models" et "models")
const CAR_MODEL_URL = 'assets/f1-car.glb';
const ENGINE_MODEL_URL = 'assets/v6-engine.glb';

// Vitesse de rotation automatique, en radians par seconde (identique quel que soit l'écran : 60 Hz, 120 Hz, 144 Hz...)
const AUTO_ROTATE_SPEED = 0.4;

const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
// Sur un écran plus haut que large (téléphone), on élargit le champ de vision pour que la voiture rentre dans l'image
function fitFieldOfView() {
    const aspect = sizes.width / sizes.height;
    camera.fov = aspect < 1 ? Math.min(70, 45 / Math.pow(aspect, 0.75)) : 45;
    camera.updateProjectionMatrix();
}
fitFieldOfView();
camera.position.set(6, -1, 7);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- GLOBE (onglet Experience) ---
const globe = createGlobe({
    camera, canvas,
    maxAnisotropy: renderer.capabilities.getMaxAnisotropy(),
    maxTexture: renderer.capabilities.maxTextureSize,
    onPlace: (place) => openPlaceCard(place)
});
scene.add(globe.group);

// --- GARAGE 3D (remplace l'ancienne image floue) ---
const garage = createGarage({ renderer, reflections: window.innerWidth > 900 && !location.search.includes('noreflect') });
scene.add(garage.group);
scene.environment = garage.envMap;          // les reflets de la voiture viennent du garage
garage.setFloorY(-3.95);
document.body.classList.add('garage3d');

// --- AVATAR : debout à côté de la voiture (la voiture tourne, lui ne bouge pas) ---
const avatar = createAvatar();
scene.add(avatar.group);
const HOME_CAM = new THREE.Vector3(6, -1, 7);
const AVATAR_XZ = new THREE.Vector3(4.6, 0, -3.6);        // à gauche de l'écran, en dehors du cercle que balaie la voiture
function placeAvatar(floorY) {
    avatar.group.position.set(AVATAR_XZ.x, floorY, AVATAR_XZ.z);
    const d = new THREE.Vector3().subVectors(HOME_CAM, avatar.group.position);
    avatar.group.rotation.y = Math.atan2(d.x, d.z) - 0.2;   // il regarde vers la caméra, un peu vers la voiture
}
placeAvatar(-3.95);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);
const mainLight = new THREE.DirectionalLight(0xffffff, 2.5);
mainLight.position.set(5, 10, 7);
scene.add(mainLight);
const fillLight = new THREE.DirectionalLight(0xffeedd, 1.5);
fillLight.position.set(-5, 3, -5);
scene.add(fillLight);

const pointsData = [
    // 0: App Conception (Capot Moteur).
    { position: new THREE.Vector3(0, 0, -1.5), radius: 0, targetEl: document.querySelector('.target-0'), panelEl: document.querySelector('#panel-0'), side: 'left' },

    // 1: Canada (Aileron Avant).
    { position: new THREE.Vector3(0, -0.5, 3.2), radius: 1.2, targetEl: document.querySelector('.target-1'), panelEl: document.querySelector('#panel-1'), side: 'left' },

    // 2: Order Tracker (Roue).
    { position: new THREE.Vector3(1.3, 0, 1.6), radius: 1.4, targetEl: document.querySelector('.target-2'), panelEl: document.querySelector('#panel-2'), side: 'right' },

    // 3: Class Leader (Aileron Arrière).
    { position: new THREE.Vector3(0.5, 0.5, -3.7), radius: 1.2, targetEl: document.querySelector('.target-3'), panelEl: document.querySelector('#panel-3'), side: 'right' }
];
const pointObjects = [];

const carGroup = new THREE.Group();
carGroup.position.y = -3;
scene.add(carGroup);

// --- ÉCRANS 3D DU COCKPIT (About Me) ---
const cockpitScreens = createCockpitScreens({ maxAnisotropy: renderer.capabilities.getMaxAnisotropy() });
carGroup.add(cockpitScreens.group);

// --- ÉCRAN DE CHARGEMENT (feux de départ) ---
const manager = new THREE.LoadingManager();
const lights = document.querySelectorAll('.light');
const loaderText = document.querySelector('.loader-text');

let isModelLoaded = false;
let areLightsReady = false;
let currentLight = 0;

const lightSequence = setInterval(() => {
    if (currentLight < 5) {
        lights[currentLight].classList.add('red');
        currentLight++;
    } else {
        clearInterval(lightSequence);
        areLightsReady = true;
        checkAndStart();
    }
}, 400);

manager.onLoad = () => {
    isModelLoaded = true;
    checkAndStart();
};
manager.onError = (url) => {
    console.error('Impossible de charger :', url);
};

function checkAndStart() {
    if (isModelLoaded && areLightsReady) {
        setTimeout(() => {
            loaderText.innerText = "GREEN GREEN GREEN !";
            lights.forEach(l => {
                l.classList.remove('red');
                l.classList.add('green');
            });
            setTimeout(() => {
                const loaderEl = document.getElementById('loader');
                loaderEl.style.opacity = 0;
                setTimeout(() => loaderEl.classList.add('hidden'), 800);
            }, 1000);
        }, 400);
    }
}

// --- CHARGEMENT DES MODÈLES (fichiers .glb compressés avec meshopt) ---
const loader = new GLTFLoader(manager);
loader.setMeshoptDecoder(MeshoptDecoder);

// Prépare les matériaux d'un modèle pour qu'ils puissent briller puis revenir à leur état d'origine
function prepareMaterials(model) {
    model.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            if (!child.material.emissive) return;
            child.userData.originalEmissive = child.material.emissive.clone();
            child.userData.originalEmissiveIntensity = child.material.emissiveIntensity;
        }
    });
}

loader.load(CAR_MODEL_URL, (gltf) => {
    const car = gltf.scene;
    const box = new THREE.Box3().setFromObject(car);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    car.position.x = -center.x;
    car.position.y = -center.y;
    car.position.z += -center.z + 1.4;

    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 7.5 / maxDim;
    car.scale.set(scale, scale, scale);

    prepareMaterials(car);
    carGroup.add(car);

    // le sol du garage se pose pile sous les roues
    carGroup.updateMatrixWorld(true);
    const floorY = new THREE.Box3().setFromObject(car).min.y;
    garage.setFloorY(floorY);
    placeAvatar(floorY);
    garage.shadow.position.y = floorY - carGroup.position.y + 0.02;
    carGroup.add(garage.shadow);

    pointsData.forEach((p, i) => {
        const anchor = new THREE.Object3D();
        anchor.position.copy(p.position);
        carGroup.add(anchor);
        pointObjects.push({ ...p, anchor: anchor, lineEl: document.querySelector(`#line-${i}`) });
    });
});

let engineModel = null;
loader.load(ENGINE_MODEL_URL, (gltf) => {
    engineModel = gltf.scene;

    // 1. Calcul de la taille réelle du moteur importé
    const engineBox = new THREE.Box3().setFromObject(engineModel);
    const engineSize = engineBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(engineSize.x, engineSize.y, engineSize.z);

    // 2. Réduction automatique (taille max = 1 pour rentrer dans la F1)
    const scale = 1 / maxDim;
    engineModel.scale.set(scale, scale, scale);

    // 3. Placement
    engineModel.position.set(-0.19, 0, -1.2);

    // Si un matériau n'a pas de lumière interne, on lui en crée une éteinte (noire)
    engineModel.traverse((child) => {
        if (child.isMesh && !child.material.emissive) {
            child.material.emissive = new THREE.Color(0x000000);
        }
    });
    prepareMaterials(engineModel);

    carGroup.add(engineModel);
});

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    fitFieldOfView();
    renderer.setSize(sizes.width, sizes.height);
    globe.resize(sizes.width, sizes.height);
});

let isAutoRotating = true;
const cameraLookAtTarget = new THREE.Vector3(0, -3, 0);
let isCockpitView = false;
let uiVisible = true; // Affichage des boîtes et des lignes

// Tourne la voiture vers un angle donné par le chemin le plus court.
// (La rotation automatique fait grandir l'angle sans fin : sans ça, la voiture pouvait faire 10 tours sur elle-même.)
function rotateCarTo(angle, duration = 1.5) {
    gsap.killTweensOf(carGroup.rotation);
    const TWO_PI = Math.PI * 2;
    const current = carGroup.rotation.y;
    let delta = (angle - current) % TWO_PI;
    if (delta > Math.PI) delta -= TWO_PI;
    if (delta < -Math.PI) delta += TWO_PI;
    gsap.to(carGroup.rotation, { y: current + delta, duration: duration, ease: "power2.inOut" });
}

function moveCamera(camPos, lookPos) {
    gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: 1.5, ease: "power2.inOut" });
    gsap.to(cameraLookAtTarget, { x: lookPos.x, y: lookPos.y, z: lookPos.z, duration: 1.5, ease: "power2.inOut" });
}

// Remet toute la voiture dans son état normal (opacité, couleurs). keepXRay = on laisse la transparence en place.
function resetCarMaterials(keepXRay = false) {
    carGroup.traverse((child) => {
        if (!child.isMesh || !child.material) return;
        const materials = Array.isArray(child.material) ? child.material : [child.material];

        materials.forEach(mat => {
            if (mat.userData.origTransparent === undefined) {
                mat.userData.origTransparent = mat.transparent;
                mat.userData.origDepthWrite = mat.depthWrite;
            }
            gsap.to(mat, {
                opacity: 1,
                duration: 0.5,
                onComplete: () => {
                    if (!keepXRay) {
                        mat.transparent = mat.userData.origTransparent;
                        mat.depthWrite = mat.userData.origDepthWrite;
                    }
                }
            });

            if (child.userData.originalEmissive && mat.emissive) {
                gsap.to(mat.emissive, {
                    r: child.userData.originalEmissive.r,
                    g: child.userData.originalEmissive.g,
                    b: child.userData.originalEmissive.b,
                    duration: 0.5,
                    onComplete: () => { mat.emissiveIntensity = child.userData.originalEmissiveIntensity ?? 1; }
                });
            }
        });
    });
}

const modalContainer = document.getElementById('modal-container');
const modalContent = document.getElementById('modal-content');

// --- FICHES DU GLOBE ---
function openPlaceCard(place) {
    modalContent.innerHTML = placeCardHTML(place);
    modalContainer.classList.add('open');
    modalContainer.scrollTop = 0;
    globe.setModalOpen(true);
}
function closeGlobeCard() {
    modalContainer.classList.remove('open');
    globe.setModalOpen(false);
}
// Bouton "See it on the globe" dans la fiche International
modalContent.addEventListener('click', (e) => {
    const go = e.target.closest('[data-goto]');
    if (!go) return;
    e.preventDefault();
    modalContainer.classList.remove('open');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    resetCarMaterials();
    document.querySelector(`.cam-btn[data-target="${go.dataset.goto}"]`).click();
});

// --- NAVIGATION (menu du haut) ---

document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.currentTarget.getAttribute('data-target');
        cockpitScreens.hide();
        resetScreenFocus();
        if (meMode) exitMe(false);
        if (screenKey) closeScreen(false);

        // Onglet Experience : on remplace la voiture par le globe
        if (target === 'front') {
            if (globe.isActive()) { globe.back(); closeGlobeCard(); return; }
            closeGlobeCard();
            if (modalContainer.classList.contains('open')) {
                modalContainer.classList.remove('open');
                document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
                resetCarMaterials();
            }
            isAutoRotating = false; isCockpitView = false; uiVisible = false;
            gsap.killTweensOf(camera.position); gsap.killTweensOf(cameraLookAtTarget);
            cameraLookAtTarget.set(0, 0, 0);
            gsap.to('.panel', { opacity: 0, duration: 0.4 });
            document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'none');
            carGroup.visible = false;
            garage.setVisible(false);
            globe.show();
            return;
        }
        // Si on quitte le globe, on ramène la voiture
        if (globe.isActive()) {
            globe.hide();
            carGroup.visible = true;
            garage.setVisible(true);
            camera.position.set(0, -1, 18);
            cameraLookAtTarget.set(0, -3, 0);
        }

        // Si une fiche était ouverte, on la ferme et on éteint les pièces en surbrillance
        if (modalContainer.classList.contains('open')) {
            modalContainer.classList.remove('open');
            document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
            resetCarMaterials();
        }

        isAutoRotating = (target === 'auto');

        // Cacher les boîtes en vue cockpit
        uiVisible = (target !== 'cockpit');
        isCockpitView = (target === 'cockpit');
        gsap.to('.panel', { opacity: uiVisible ? 1 : 0, duration: 0.5 });
        document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = uiVisible ? 'auto' : 'none');

        let camPos = { x: 6, y: -1, z: 7 };
        let lookPos = { x: 0, y: -3, z: 0 };

        if (target === 'front') {
            rotateCarTo(0);
            camPos = { x: 0, y: -2, z: 8 };
        } else if (target === 'engine') {
            rotateCarTo(0);
            camPos = { x: 0, y: 1, z: -6 };
        } else if (target === 'cockpit') {
            rotateCarTo(Math.PI);
            camPos = { x: 0, y: -2.6, z: 0.5 };
            lookPos = { x: 0, y: -2.6, z: -10 };
            setTimeout(() => { if (isCockpitView) cockpitScreens.show(); }, 1200);
        }

        moveCamera(camPos, lookPos);
    });
});


// --- GRAND ÉCRAN DU GARAGE : affiche la version courte de la fiche ---
const screenHud = document.getElementById('screen-hud');
const shLink = document.getElementById('sh-link');
const panelKeys = Array.from(document.querySelectorAll('.panel')).map(p => p.getAttribute('data-modal'));
let screenKey = null;
function screenCam() {
    const c = garage.screenCenter;
    const mobile = sizes.width < 700;
    const d = mobile ? 7 : 8.5;
    return { cam: { x: c.x + 0.35, y: -3.95 + 3.4, z: c.z + d }, look: { x: c.x, y: -3.95 + 4.6, z: c.z } };
}
// La pièce se place en bas à gauche de l'image ; le grand écran du fond s'accroche à droite, derrière elle.
const _vc = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
function layoutScreenView(cam, look) {
    const mobile = sizes.width < 700, aspect = sizes.width / sizes.height;
    _vc.fov = camera.fov; _vc.aspect = aspect; _vc.updateProjectionMatrix();
    const pos = new THREE.Vector3(cam.x, cam.y, cam.z), tgt = new THREE.Vector3(look.x, look.y, look.z);
    const fwd = new THREE.Vector3().subVectors(tgt, pos); const dP = fwd.length(); fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
    const up = new THREE.Vector3().crossVectors(right, fwd).normalize();
    const halfH = dP * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), halfW = halfH * aspect;
    // décale la cible : la pièce passe à gauche / en bas (sur mobile : en bas seulement)
    const newLook = tgt.clone().addScaledVector(right, mobile ? 0 : 0.36 * halfW).addScaledVector(up, mobile ? 0.5 * halfH : 0.14 * halfH);
    // rayon vers le point de l'écran où l'on veut le centre du grand écran
    _vc.position.copy(pos); _vc.lookAt(newLook); _vc.updateMatrixWorld();
    const ndc = mobile ? new THREE.Vector2(0, 0.45) : new THREE.Vector2(0.36, 0.0);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, _vc);
    const dir = ray.ray.direction;
    const wallZ = -15.95;
    let hit = null;
    if (dir.z < -0.05) { const t = (wallZ - pos.z) / dir.z; hit = pos.clone().addScaledVector(dir, t); }
    if (!hit) hit = new THREE.Vector3(0, -1.5, wallZ);
    const D = Math.abs(wallZ - pos.z);
    const viewW = 2 * D * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * aspect;
    const scale = THREE.MathUtils.clamp((mobile ? 0.92 : 0.46) * viewW / 11, 0.5, 1.5);
    return { look: newLook, x: THREE.MathUtils.clamp(hit.x, -9, 9), y: Math.max(hit.y, -3.95 + 2.75 * scale + 0.15), scale };
}
function showOnScreen(key, index) {
    if (!screenData[key]) return;
    screenKey = key;
    const d = screenData[key];
    garage.setScreen(d);
    document.querySelectorAll('.panel').forEach((p, i) => p.classList.toggle('active', i === index));
    uiVisible = false;
    gsap.to('.panel', { opacity: 0, duration: 0.4 });
    document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'none');
    if (d.link) { shLink.textContent = d.link.label; shLink.href = d.link.href; shLink.classList.remove('hidden'); }
    else if (d.goto) { shLink.textContent = 'See it on the globe →'; shLink.href = '#'; shLink.dataset.goto = d.goto; shLink.classList.remove('hidden'); }
    else shLink.classList.add('hidden');
    if (!d.goto) delete shLink.dataset.goto;
    screenHud.classList.remove('hidden');
    requestAnimationFrame(() => screenHud.classList.add('visible'));
}
function closeScreen(moveCam = true) {
    if (!screenKey) return;
    screenKey = null;
    garage.setScreen(null);
    garage.setScreenPose(null);
    screenHud.classList.remove('visible');
    setTimeout(() => { if (!screenKey) screenHud.classList.add('hidden'); }, 500);
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    resetCarMaterials();
    if (moveCam) {
        isAutoRotating = true; uiVisible = true;
        gsap.to('.panel', { opacity: 1, duration: 0.6, delay: 0.5 });
        document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'auto');
        moveCamera({ x: 6, y: -1, z: 7 }, { x: 0, y: -3, z: 0 });
    }
}
function stepScreen(dir) {
    const i = (panelKeys.indexOf(screenKey) + dir + panelKeys.length) % panelKeys.length;
    document.querySelectorAll('.panel')[i].click();
}
document.getElementById('sh-prev').addEventListener('click', () => stepScreen(-1));
document.getElementById('sh-next').addEventListener('click', () => stepScreen(1));
document.getElementById('sh-close').addEventListener('click', () => closeScreen(true));
document.getElementById('sh-more').addEventListener('click', () => {
    modalContent.innerHTML = panelsData[screenKey];
    modalContainer.classList.add('open'); modalContainer.scrollTop = 0;
});
shLink.addEventListener('click', (e) => {
    if (!shLink.dataset.goto) return;
    e.preventDefault();
    const g = shLink.dataset.goto; closeScreen(false);
    document.querySelector(`.cam-btn[data-target="${g}"]`).click();
});

// --- CLIC SUR UNE BOÎTE : fiche détaillée + surbrillance de la pièce ---
document.querySelectorAll('.panel').forEach((panel, index) => {
    panel.addEventListener('click', () => {
        const templateId = panel.getAttribute('data-modal');
        showOnScreen(templateId, index);
        cockpitScreens.hide();
        resetScreenFocus();
        isCockpitView = false;

        // 1. Arrêt et réalignement de la voiture
        isAutoRotating = false;
        rotateCarTo(0);

        if (pointObjects.length === 0) return;
        try {
            const isXRay = (panel.id === 'panel-0');

            // 2. On remet toute la voiture à l'état normal
            resetCarMaterials(isXRay);

            // 3. Effet Rayon X pour le Panel 0 : tout devient transparent sauf le moteur
            if (isXRay && engineModel) {
                const engineMeshes = new Set();
                engineModel.traverse((c) => { if (c.isMesh) engineMeshes.add(c); });

                carGroup.traverse((child) => {
                    if (child.isMesh && !engineMeshes.has(child)) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        materials.forEach(mat => {
                            mat.transparent = true;
                            mat.depthWrite = false;
                            gsap.to(mat, { opacity: 0.15, duration: 1.5, overwrite: 'auto' });
                        });
                    }
                });
            }

            // 4. On cherche toutes les pièces dans un rayon autour du point
            const targetWorld = new THREE.Vector3();
            pointObjects[index].anchor.getWorldPosition(targetWorld);
            const radius = pointObjects[index].radius;
            const meshesToHighlight = [];

            carGroup.traverse((child) => {
                if (child.isMesh && child.geometry && child.material && child.material.emissive) {
                    if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                    const center = new THREE.Vector3();
                    child.geometry.boundingBox.getCenter(center);
                    child.localToWorld(center);
                    if (center.distanceTo(targetWorld) <= radius) meshesToHighlight.push(child);
                }
            });

            if (isXRay && engineModel) {
                engineModel.traverse((child) => {
                    if (child.isMesh && child.material) meshesToHighlight.push(child);
                });
            }

            // 5. On colore toutes les pièces trouvées
            const glowColor = new THREE.Color(0x00d2ff);
            meshesToHighlight.forEach((mesh) => {
                gsap.to(mesh.material.emissive, { r: glowColor.r, g: glowColor.g, b: glowColor.b, duration: 1, overwrite: 'auto' });
                mesh.material.emissiveIntensity = 2.5;
            });
        } catch (error) {
            console.warn("Erreur silencieuse de surbrillance 3D :", error);
        }

        // --- RÉGLAGES DES CAMÉRAS (C'EST ICI POUR LE ZOOM) ---
        let targetCamPos = { x: 4, y: -1, z: 6 };
        let targetLookPos = { x: -2, y: -3, z: 0 };

        if (panel.id === 'panel-0') {
            // App Conception (Capot Moteur)
            targetCamPos = { x: 4.0, y: -2.2, z: 0.5 };
            targetLookPos = { x: 1.5, y: -2.9, z: -1.5 };
        } else if (panel.id === 'panel-1') {
            // Canada (Aileron Avant)
            targetCamPos = { x: 2.0, y: -2.3, z: 6.5 };
            targetLookPos = { x: 0.5, y: -3.0, z: 3.2 };
        } else if (panel.id === 'panel-2') {
            // Order Tracker (Roue Avant Droite)
            targetCamPos = { x: 4.4, y: -2.3, z: 4.6 };
            targetLookPos = { x: 1.5, y: -2.9, z: 1.6 };
        } else if (panel.id === 'panel-3') {
            // Class Leader (Aileron Arrière)
            targetCamPos = { x: 3.6, y: -2.1, z: -0.2 };
            targetLookPos = { x: 0.5, y: -2.5, z: -3.7 };
        }

        // la caméra zoome sur la pièce ; le grand écran du fond se place derrière elle
        const lay = layoutScreenView(targetCamPos, targetLookPos);
        moveCamera(targetCamPos, { x: lay.look.x, y: lay.look.y, z: lay.look.z });
        garage.setScreenPose(lay.x, lay.y, lay.scale);
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    if (globe.isActive()) { closeGlobeCard(); return; }
    if (screenKey) { modalContainer.classList.remove('open'); return; }
    modalContainer.classList.remove('open');
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    isAutoRotating = true;
    resetCarMaterials();
    moveCamera({ x: 6, y: -1, z: 7 }, { x: 0, y: -3, z: 0 });
});

// --- ÉCRANS DU COCKPIT : clic = on plonge dans l'écran, la page s'affiche en plein écran ---
const COCKPIT_CAM = { x: 0, y: -2.6, z: 0.5 };
const COCKPIT_LOOK = { x: 0, y: -2.6, z: -10 };
const screenNav = document.getElementById('screen-nav');
const screenNavLabel = document.getElementById('sn-label');
const screenPage = document.getElementById('screen-page');
const spTitle = document.getElementById('sp-title');
const spDots = document.getElementById('sp-dots');
const spBody = document.getElementById('sp-body');
let focusedScreen = null;
let pageTimer = null;

// Affiche (ou met à jour) la page web plein écran de l'écran visé
function renderScreenPage() {
    if (!focusedScreen) return;
    spTitle.textContent = focusedScreen.title.replace(' // ', ' · ');
    spDots.innerHTML = Array.from({ length: focusedScreen.pageCount }, (_, i) =>
        `<i class="${i === focusedScreen.page ? 'on' : ''}"></i>`).join('');
    spBody.innerHTML = pageToHTML(focusedScreen.pageBlocks);
    spBody.classList.remove('swap'); void spBody.offsetWidth; spBody.classList.add('swap');
    screenNavLabel.textContent = `${focusedScreen.pageName}  (${focusedScreen.page + 1}/${focusedScreen.pageCount})`;
}
// Sort du mode plein écran sans bouger la caméra (utilisé par le menu et les fiches)
function resetScreenFocus() {
    focusedScreen = null;
    if (pageTimer) { pageTimer.kill(); pageTimer = null; }
    screenPage.classList.remove('visible');
    screenNav.classList.add('hidden');
    cockpitScreens.setFocused(null);
}
function focusScreen(screen) {
    focusedScreen = screen;
    cockpitScreens.setFocused(screen);
    const pose = cockpitScreens.focusPose(screen, camera);
    // la caméra "entre" dans l'écran…
    gsap.killTweensOf(camera.position); gsap.killTweensOf(cameraLookAtTarget);
    gsap.to(camera.position, { x: pose.position.x, y: pose.position.y, z: pose.position.z, duration: 1.3, ease: "power2.in" });
    gsap.to(cameraLookAtTarget, { x: pose.target.x, y: pose.target.y, z: pose.target.z, duration: 1.3, ease: "power2.in" });
    // …puis la page web prend le relais (texte net)
    if (pageTimer) pageTimer.kill();
    pageTimer = gsap.delayedCall(1.05, () => {
        renderScreenPage();
        screenPage.classList.add('visible');
        screenNav.classList.remove('hidden');
    });
}
function unfocusScreen() {
    if (!focusedScreen) return;
    resetScreenFocus();
    moveCamera(COCKPIT_CAM, COCKPIT_LOOK);
}
function changePage(step) {
    if (!focusedScreen || !screenPage.classList.contains('visible')) return;
    focusedScreen.setPage(focusedScreen.page + step);
    renderScreenPage();
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
function pointerRay(e) {
    pointer.set((e.clientX / sizes.width) * 2 - 1, -(e.clientY / sizes.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
}
canvas.addEventListener('click', (e) => {
    if (!cockpitScreens.isActive() || focusedScreen) return;
    pointerRay(e);
    const screen = cockpitScreens.pick(raycaster);
    if (screen) focusScreen(screen);
});
window.addEventListener('pointermove', (e) => {
    if (!cockpitScreens.isActive() || focusedScreen) { canvas.style.cursor = ''; return; }
    pointerRay(e);
    canvas.style.cursor = cockpitScreens.pick(raycaster) ? 'pointer' : '';
});
document.getElementById('sn-prev').addEventListener('click', () => changePage(-1));
document.getElementById('sn-next').addEventListener('click', () => changePage(1));
document.getElementById('sn-close').addEventListener('click', unfocusScreen);
window.addEventListener('keydown', (e) => {
    if (!focusedScreen) return;
    if (e.key === 'ArrowRight') changePage(1);
    else if (e.key === 'ArrowLeft') changePage(-1);
    else if (e.key === 'Escape') unfocusScreen();
});

// --- AVATAR : clic = zoom sur lui, la voiture disparaît, ses infos s'affichent ---
const mePanel = document.getElementById('me-panel');
const meHint = document.getElementById('me-hint');
const SHOW_AVATAR = false;   // passe à true quand le modèle 3D de Tanguy sera prêt
if (!SHOW_AVATAR) avatar.group.visible = false;
document.getElementById('me-content').innerHTML = meCard;
let meMode = false;
const avatarHead = new THREE.Vector3();
function avatarCamera() {
    const base = avatar.group.position;
    const f = new THREE.Vector3(Math.sin(avatar.group.rotation.y), 0, Math.cos(avatar.group.rotation.y));   // là où il regarde
    const right = new THREE.Vector3(f.z, 0, -f.x);                                                           // droite de l'écran vue de face
    const mobile = sizes.width < 700;
    const cam = base.clone().addScaledVector(f, mobile ? 4.4 : 3.5); cam.y = base.y + 2.1;
    const look = base.clone().addScaledVector(right, mobile ? 0 : 1.05); look.y = base.y + (mobile ? 1.75 : 1.95);
    return { cam, look };
}
function enterMe() {
    if (meMode) return;
    meMode = true;
    isAutoRotating = false; isCockpitView = false;
    cockpitScreens.hide(); resetScreenFocus();
    uiVisible = false;
    gsap.to('.panel', { opacity: 0, duration: 0.4 });
    document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'none');
    const { cam, look } = SHOW_AVATAR ? avatarCamera() : { cam: camera.position, look: cameraLookAtTarget };
    gsap.killTweensOf(camera.position); gsap.killTweensOf(cameraLookAtTarget);
    gsap.to(camera.position, { x: cam.x, y: cam.y, z: cam.z, duration: 1.5, ease: 'power2.inOut' });
    gsap.to(cameraLookAtTarget, { x: look.x, y: look.y, z: look.z, duration: 1.5, ease: 'power2.inOut' });
    if (SHOW_AVATAR) gsap.delayedCall(1.0, () => { if (meMode) carGroup.visible = false; });
    gsap.delayedCall(1.1, () => { if (meMode) { mePanel.classList.remove('hidden'); requestAnimationFrame(() => mePanel.classList.add('visible')); } });
}
function exitMe(moveCam = true) {
    if (!meMode) return;
    meMode = false;
    carGroup.visible = true;
    mePanel.classList.remove('visible');
    setTimeout(() => { if (!meMode) mePanel.classList.add('hidden'); }, 600);
    if (moveCam) {
        isAutoRotating = true; uiVisible = true;
        gsap.to('.panel', { opacity: 1, duration: 0.6, delay: 0.5 });
        document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'auto');
        moveCamera({ x: 6, y: -1, z: 7 }, { x: 0, y: -3, z: 0 });
    }
}
document.getElementById('me-back').addEventListener('click', () => exitMe(true));
meHint.addEventListener('click', enterMe);
function avatarClickable() { return SHOW_AVATAR && !meMode && !globe.isActive() && !cockpitScreens.isActive() && !focusedScreen && !modalContainer.classList.contains('open'); }
canvas.addEventListener('click', (e) => {
    if (!avatarClickable()) return;
    pointerRay(e);
    if (raycaster.intersectObjects(avatar.pickable, false).length) enterMe();
});
window.addEventListener('pointermove', (e) => {
    // la tête de l'avatar suit doucement le curseur
    avatarHead.set(0, avatar.headHeight, 0).applyMatrix4(avatar.group.matrixWorld).project(camera);
    const ax = (avatarHead.x * 0.5 + 0.5) * sizes.width, ay = (-avatarHead.y * 0.5 + 0.5) * sizes.height;
    avatar.setLook((e.clientX - ax) / (sizes.width * 0.5), (e.clientY - ay) / (sizes.height * 0.5));
    if (!avatarClickable()) return;
    pointerRay(e);
    const over = raycaster.intersectObjects(avatar.pickable, false).length > 0;
    if (over) canvas.style.cursor = 'pointer';
    else if (canvas.style.cursor === 'pointer' && !cockpitScreens.isActive()) canvas.style.cursor = '';
});

// Clavier : Entrée/Espace ouvre une carte, Échap ferme la fiche
document.querySelectorAll('.panel').forEach(p => p.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); p.click(); }
}));
window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (meMode) { exitMe(true); return; }
    if (screenKey && !modalContainer.classList.contains('open')) { closeScreen(true); return; }
    if (modalContainer.classList.contains('open')) document.getElementById('close-modal').click();
    else if (globe.isActive() && globe.isFocused()) globe.back();
});

// --- BOUCLE D'ANIMATION ---
const clock = new THREE.Clock();
const screenPosition = new THREE.Vector3();

const loaderEl = () => document.getElementById('loader');
const tick = () => {
    const delta = Math.min(clock.getDelta(), 0.1); // 0.1 max : évite un saut après un changement d'onglet
    if (isAutoRotating) carGroup.rotation.y -= AUTO_ROTATE_SPEED * delta;
    globe.update(delta);
    avatar.update(delta);
    avatar.group.visible = SHOW_AVATAR && !globe.isActive();
    {   // bulle "Meet Tanguy" au-dessus de sa tête, seulement sur la vue d'accueil
        const show = isAutoRotating && !meMode && !globe.isActive() && !isCockpitView && !modalContainer.classList.contains('open');
        if (show && SHOW_AVATAR) {
            avatarHead.set(0, avatar.headHeight + 0.55, 0).applyMatrix4(avatar.group.matrixWorld).project(camera);
            meHint.style.transform = `translate(${Math.min(sizes.width - 80, (avatarHead.x * 0.5 + 0.5) * sizes.width).toFixed(0)}px, ${((-avatarHead.y * 0.5 + 0.5) * sizes.height).toFixed(0)}px) translate(-50%, -100%)`;
            meHint.classList.remove('hidden');
        }
        meHint.classList.toggle('fixedpos', !SHOW_AVATAR); if (!SHOW_AVATAR) meHint.classList.remove('hidden');
        meHint.classList.toggle('on', show && loaderEl().classList.contains('hidden'));
    }
    camera.lookAt(cameraLookAtTarget);
    cockpitScreens.update(delta);

    for (const pt of pointObjects) {
        pt.anchor.getWorldPosition(screenPosition);
        screenPosition.project(camera);

        if (screenPosition.z > 1 || !uiVisible) {
            pt.targetEl.classList.add('hidden');
            pt.lineEl.style.opacity = 0;
        } else {
            pt.targetEl.classList.remove('hidden');
            pt.lineEl.style.opacity = 1;

            const targetX = (screenPosition.x * 0.5 + 0.5) * sizes.width;
            const targetY = (-screenPosition.y * 0.5 + 0.5) * sizes.height;

            pt.targetEl.style.left = `${targetX}px`;
            pt.targetEl.style.top = `${targetY}px`;

            const panelRect = pt.panelEl.getBoundingClientRect();
            const panelX = pt.side === 'left' ? panelRect.right : panelRect.left;
            const panelY = panelRect.top + (panelRect.height / 2);

            pt.lineEl.setAttribute('x1', panelX);
            pt.lineEl.setAttribute('y1', panelY);
            pt.lineEl.setAttribute('x2', targetX);
            pt.lineEl.setAttribute('y2', targetY);
        }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
};

tick();
