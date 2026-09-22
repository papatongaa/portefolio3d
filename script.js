import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { panelsData } from './content.js';

const canvas = document.querySelector('.webgl');
const scene = new THREE.Scene();

const sizes = { width: window.innerWidth, height: window.innerHeight };
const camera = new THREE.PerspectiveCamera(45, sizes.width / sizes.height, 0.1, 100);
camera.position.set(6, -1, 7); 
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const cssRenderer = new CSS3DRenderer();
cssRenderer.setSize(sizes.width, sizes.height);
cssRenderer.domElement.style.position = 'absolute';
cssRenderer.domElement.style.top = '0';
cssRenderer.domElement.style.pointerEvents = 'none'; // so it doesn't block WebGL clicks
cssRenderer.domElement.style.zIndex = '5';
document.body.appendChild(cssRenderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); 
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
    
    // 2: Order Tracker (Roue). On décale le point vers l'extérieur (X = 1.6) et on réduit le rayon (0.6) pour éviter les suspensions.
    { position: new THREE.Vector3(1.3, 0, 1.6), radius: 1.4, targetEl: document.querySelector('.target-2'), panelEl: document.querySelector('#panel-2'), side: 'right' },
    
    // 3: Class Leader (Aileron Arrière).
    { position: new THREE.Vector3(0.5, 0.5, -3.7), radius: 1.2, targetEl: document.querySelector('.target-3'), panelEl: document.querySelector('#panel-3'), side: 'right' }
];
const pointObjects = [];

const carGroup = new THREE.Group(); 
carGroup.position.y = -3; 
scene.add(carGroup);

const dashEl = document.getElementById('steering-dash');
const dashObj = new CSS3DObject(dashEl);
dashObj.position.set(0, 0.30, 0.7); // Tweak height to nestle perfectly
dashObj.rotation.x = -0.12; // Tilted to match halo angle
dashObj.rotation.y = Math.PI; // Face the camera
dashObj.scale.set(0.0028, 0.0028, 0.0028); // Scaled up so the curved edges fill the space
carGroup.add(dashObj);

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

const loader = new GLTFLoader(manager);
loader.load('models/scene.gltf', (gltf) => {
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

    car.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            if (child.material.emissive) {
                child.userData.originalEmissive = child.material.emissive.clone();
            }
        }
    });

    carGroup.add(car);

    pointsData.forEach(p => {
        const anchor = new THREE.Object3D();
        anchor.position.copy(p.position);
        carGroup.add(anchor);
        pointObjects.push({ ...p, anchor: anchor, lineEl: document.querySelector(`#line-${pointsData.indexOf(p)}`) });
    });
});

window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
    cssRenderer.setSize(sizes.width, sizes.height);
});

let isAutoRotating = true;
const cameraLookAtTarget = new THREE.Vector3(0, -3, 0);
let uiVisible = true; // Nouvelle variable pour gérer l'affichage de l'interface

document.querySelectorAll('.cam-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = e.target.getAttribute('data-target');
        const dash = document.getElementById('steering-dash');
        
        dash.classList.add('hidden');
        isAutoRotating = (target === 'auto'); 
        
        // GESTION DE L'INTERFACE (Cacher boîtes au passage en cockpit)
        uiVisible = (target !== 'cockpit');
        if (!uiVisible) {
            gsap.to('.panel', { opacity: 0, duration: 0.5 });
            document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'none');
        } else {
            gsap.to('.panel', { opacity: 1, duration: 0.5 });
            document.querySelectorAll('.panel').forEach(p => p.style.pointerEvents = 'auto');
        }
        
        let camPos = { x: 6, y: -1, z: 7 };
        let lookPos = { x: 0, y: -3, z: 0 }; 
        
        if(target === 'front') {
            camPos = { x: 0, y: -2, z: 8 };
            lookPos = { x: 0, y: -3, z: 0 };
        } else if(target === 'engine') {
            camPos = { x: 0, y: 1, z: -6 };
            lookPos = { x: 0, y: -3, z: 0 };
        } else if(target === 'cockpit') {
            gsap.to(carGroup.rotation, { y: Math.PI, duration: 1.5, ease: "power2.inOut" });
            camPos = { x: 0, y: -2.6, z: 0.5 }; 
            lookPos = { x: 0, y: -2.6, z: -10 }; 
            setTimeout(() => { dash.classList.remove('hidden'); }, 1200);
        }
        
        gsap.to(camera.position, { x: camPos.x, y: camPos.y, z: camPos.z, duration: 1.5, ease: "power2.inOut" });
        gsap.to(cameraLookAtTarget, { x: lookPos.x, y: lookPos.y, z: lookPos.z, duration: 1.5, ease: "power2.inOut" });
    });
});

const modalContainer = document.getElementById('modal-container');

let engineModel = null;
loader.load('models.engine/scene.gltf', (gltf) => {
    engineModel = gltf.scene;
    
    // 1. Calcul de la taille réelle du moteur importé
    const engineBox = new THREE.Box3().setFromObject(engineModel);
    const engineSize = engineBox.getSize(new THREE.Vector3());
    const maxDim = Math.max(engineSize.x, engineSize.y, engineSize.z);
    
    // 2. Réduction automatique (on force la taille max à 1.5 pour rentrer dans la F1)
    const scale = 1 / maxDim;
    engineModel.scale.set(scale, scale, scale);
    
    // 3. Placement (à ajuster si le moteur dépasse un peu)
    engineModel.position.set(-0.19, 0, -1.2); 
    // Préparation des matériaux du moteur pour qu'ils puissent briller
    engineModel.traverse((child) => {
        if (child.isMesh) {
            child.material = child.material.clone();
            // Si le modèle n'a pas de lumière interne, on lui en crée une éteinte (noire)
            if (!child.material.emissive) {
                child.material.emissive = new THREE.Color(0x000000);
            }
            child.userData.originalEmissive = child.material.emissive.clone();
        }
    });
    
    carGroup.add(engineModel);
});

const modalContent = document.getElementById('modal-content');

document.querySelectorAll('.panel').forEach((panel, index) => {
    panel.addEventListener('click', () => {
        const templateId = panel.getAttribute('data-modal');
        if (panelsData[templateId]) {
            modalContent.innerHTML = panelsData[templateId];
        } else {
            // Affiche directement l'ID manquant à l'écran pour t'aider à le trouver !
            modalContent.innerHTML = `<p style="color: red;">Erreur : La clé <b>'${templateId}'</b> est introuvable dans content.js</p>`;
            console.log("Il manque cette clé dans content.js :", templateId);
        }
        modalContainer.classList.add('open');
        isAutoRotating = false;

        // Bloc SÉCURISÉ pour la couleur de la pièce
        modalContainer.classList.add('open');
        
        // 1. ARRÊT ET RÉALIGNEMENT DE LA VOITURE
        isAutoRotating = false;
        gsap.killTweensOf(carGroup.rotation); // Sécurité : coupe toute animation de rotation précédente
        const currentRot = carGroup.rotation.y;
        const targetRot = Math.round(currentRot / (Math.PI * 2)) * (Math.PI * 2);
        gsap.to(carGroup.rotation, { y: targetRot, duration: 1.5, ease: "power2.inOut" });
        if (pointObjects.length > 0) {
            try {
                // 1. On réinitialise l'opacité et les couleurs de toute la voiture
                carGroup.traverse((child) => {
                    if (child.isMesh && child.material) {
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        
                        materials.forEach(mat => {
                            if (mat.userData.origTransparent === undefined) {
                                mat.userData.origTransparent = mat.transparent;
                                mat.userData.origDepthWrite = mat.depthWrite;
                            }
                            
                            const isXRay = (panel.id === 'panel-0');
                            
                            gsap.to(mat, { 
                                opacity: 1, 
                                duration: 0.5,
                                onComplete: () => {
                                    // On ne rend la solidité QUE si on n'est pas en train de faire l'effet Rayon X
                                    if (!isXRay) {
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
                                    duration: 0.5 
                                });
                            }
                        });
                    }
                });

                // 2. Effet Rayon X pour le Panel 0
                if (panel.id === 'panel-0' && engineModel) {
                    carGroup.traverse((child) => {
                        let isEnginePart = false;
                        engineModel.traverse((engineChild) => { if (child === engineChild) isEnginePart = true; });
                        
                        if (child.isMesh && !isEnginePart) {
                            const materials = Array.isArray(child.material) ? child.material : [child.material];
                            materials.forEach(mat => {
                                mat.transparent = true;
                                mat.depthWrite = false; 
                                gsap.to(mat, { opacity: 0.15, duration: 1.5 });
                            });
                        }
                    });
                }
                // 2. NOUVEAU : On cherche TOUTES les pièces dans un rayon donné
                const targetWorld = new THREE.Vector3();
                pointObjects[index].anchor.getWorldPosition(targetWorld);
                
                let meshesToHighlight = [];
                
                // On récupère le rayon spécifique défini dans pointsData
                const radius = pointObjects[index].radius;
                
                carGroup.traverse((child) => {
                    if (child.isMesh && child.geometry && child.material && child.material.emissive) {
                        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
                        
                        if (child.geometry.boundingBox) {
                            const center = new THREE.Vector3();
                            child.geometry.boundingBox.getCenter(center);
                            child.localToWorld(center);
                            
                            const dist = center.distanceTo(targetWorld);
                            if (dist <= radius) {
                                meshesToHighlight.push(child);
                            }
                        }
                    }
                });

                if (panel.id === 'panel-0' && engineModel) {
                    engineModel.traverse((child) => {
                        if (child.isMesh && child.material) {
                            meshesToHighlight.push(child);
                        }
                   });
                }
                // 3. On colore toutes les pièces trouvées dans le rayon
                meshesToHighlight.forEach((mesh) => {
                    const glowColor = new THREE.Color(0x00d2ff); 
                    gsap.to(mesh.material.emissive, { 
                        r: glowColor.r, 
                        g: glowColor.g, 
                        b: glowColor.b, 
                        duration: 1 
                    });
                    mesh.material.emissiveIntensity = 2.5; // Intensité de la couleur
                });
            } catch (error) {
                console.warn("Erreur silencieuse de surbrillance 3D :", error);
            }
        }
        
        // --- RÉGLAGES DES CAMÉRAS (C'EST ICI POUR LE ZOOM) ---
        
        let targetCamPos = { x: 4, y: -1, z: 6 };
        let targetLookPos = { x: -2, y: -3, z: 0 };

        if (panel.id === 'panel-0') {
            // App Conception (Capot Moteur) - On garde intact car c'était parfait
            targetCamPos = { x: 4.0, y: -1.0, z: 0.5 }; 
            targetLookPos = { x: 1.5, y: -2.9, z: -1.5 }; 
            
        } else if (panel.id === 'panel-1') {
            // Canada (Aileron Avant) - Caméra placée loin DEVANT la voiture (Z=6.5) avec léger angle à droite (X=2.0)
            targetCamPos = { x: 2.0, y: -1.5, z: 6.5 }; 
            targetLookPos = { x: 0.5, y: -3.0, z: 3.2 }; 
            
        } else if (panel.id === 'panel-2') {
            // Order Tracker (Roue Avant Droite) - Vue de profil pur (Z de la caméra = Z de la roue) pour être du bon côté
            targetCamPos = { x: 4.5, y: -1.5, z: 1.6 };
            targetLookPos = { x: 2.0, y: -2.8, z: 1.6 };
            
        } else if (panel.id === 'panel-3') {
            // Class Leader (Aileron Arrière) - Caméra placée DERRIÈRE la voiture (Z=-6.5) regardant vers l'aileron (Z=-3.7)
            targetCamPos = { x: 2, y: -1.2, z: 4.0 }; 
            targetLookPos = { x: 1.5, y: -1.8, z: -1.5 };
        }

        gsap.to(camera.position, { x: targetCamPos.x, y: targetCamPos.y, z: targetCamPos.z, duration: 1.5, ease: "power2.inOut" });
        gsap.to(cameraLookAtTarget, { x: targetLookPos.x, y: targetLookPos.y, z: targetLookPos.z, duration: 1.5, ease: "power2.inOut" });
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    modalContainer.classList.remove('open');
    isAutoRotating = true;
    const currentRot = carGroup.rotation.y;
        const targetRot = Math.round(currentRot / (Math.PI * 2)) * (Math.PI * 2);
        gsap.to(carGroup.rotation, { y: targetRot, duration: 1.5, ease: "power2.inOut" });
    
    // Extinction sécurisée à la fermeture
    
    try {
        carGroup.traverse((child) => {
            if (child.isMesh && child.material) {
                const materials = Array.isArray(child.material) ? child.material : [child.material];
                materials.forEach(mat => {
                    gsap.to(mat, { 
                        opacity: 1, 
                        duration: 0.5,
                        onComplete: () => {
                            if (mat.userData.origTransparent !== undefined) {
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
                            duration: 0.5 
                        });
                    }
                });
            }
        });
    } catch (error) {}
    
    gsap.to(camera.position, { x: 6, y: -1, z: 7, duration: 1.5, ease: "power2.inOut" });
    gsap.to(cameraLookAtTarget, { x: 0, y: -3, z: 0, duration: 1.5, ease: "power2.inOut" });
});

const tick = () => {
    if(isAutoRotating) carGroup.rotation.y -= 0.02;
    camera.lookAt(cameraLookAtTarget);

    if(pointObjects.length > 0) {
        for(const pt of pointObjects) {
            const screenPosition = new THREE.Vector3();
            pt.anchor.getWorldPosition(screenPosition);
            screenPosition.project(camera);

            if(screenPosition.z > 1 || !uiVisible) {
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
    }
    renderer.render(scene, camera);
    cssRenderer.render(scene, camera);
    requestAnimationFrame(tick);
};

tick();