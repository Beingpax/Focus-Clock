import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

const canvas = document.querySelector('#world-canvas');
const worldElement = document.querySelector('#world');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const reduceData = matchMedia('(prefers-reduced-data: reduce)').matches || navigator.connection?.saveData;
const lowPower = reduceMotion || reduceData || (navigator.hardwareConcurrency || 4) <= 4 || innerWidth < 720;

const noopWorld = { setEnergy() {}, destroy() {} };
const damp = (current, target, speed, dt) => THREE.MathUtils.damp(current, target, speed, dt);

function makeRoad(curve, width, segments) {
  const vertices = [], uvs = [], indices = [];
  const up = new THREE.Vector3(0, 1, 0);
  const point = new THREE.Vector3(), tangent = new THREE.Vector3(), side = new THREE.Vector3();
  for (let i = 0; i <= segments; i += 1) {
    const t = i / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent);
    side.crossVectors(up, tangent).normalize();
    for (const edge of [-1, 1]) {
      vertices.push(point.x + side.x * width * edge, point.y, point.z + side.z * width * edge);
      uvs.push(edge < 0 ? 0 : 1, t);
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function fallbackCar() {
  const car = new THREE.Group();
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x551013, metalness: .72, roughness: .2, clearcoat: 1, clearcoatRoughness: .12 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x121a20, metalness: .15, roughness: .12, transmission: .2 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.9, .48, 4.2), paint);
  body.position.y = .62;
  car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.62, .62, 1.9), glass);
  cabin.position.set(0, 1.03, .15);
  car.add(cabin);
  const tireMaterial = new THREE.MeshStandardMaterial({ color: 0x090909, roughness: .92 });
  for (const x of [-1, 1]) for (const z of [-1.25, 1.25]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(.35, .35, .24, 20), tireMaterial);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x * .9, .38, z);
    wheel.name = 'wheel';
    car.add(wheel);
  }
  return car;
}

export function createWorld() {
  if (!canvas || !worldElement || reduceData) return noopWorld;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !lowPower, alpha: false, powerPreference: 'high-performance' });
  } catch { return noopWorld; }

  renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = !lowPower;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111b27);
  scene.fog = new THREE.Fog(0x1d2935, 70, 260);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 420);
  camera.position.set(0, 4.4, 10);

  const textureLoader = new THREE.TextureLoader();
  const loadTexture = (url, repeatX, repeatY, color = true) => {
    const texture = textureLoader.load(url);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(repeatX, repeatY);
    texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };
  const asphaltMap = loadTexture('/assets/textures/asphalt-diffuse.jpg', 2.2, 70);
  const asphaltNormal = loadTexture('/assets/textures/asphalt-normal.jpg', 2.2, 70, false);
  const forestMap = loadTexture('/assets/textures/forest-ground-diffuse.jpg', 34, 34);
  new RGBELoader().load('/assets/environments/forest-slope.hdr', texture => {
    if (destroyed) { texture.dispose(); return; }
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    scene.background = texture;
    scene.backgroundBlurriness = .12;
    scene.environmentIntensity = .72;
  }, undefined, () => { /* Keep the calibrated dusk background if HDR loading fails. */ });

  scene.add(new THREE.HemisphereLight(0xb9d8ff, 0x17201b, 1.7));
  const sun = new THREE.DirectionalLight(0xffd1a3, 4.5);
  sun.position.set(-45, 65, 25);
  sun.castShadow = !lowPower;
  sun.shadow.mapSize.set(lowPower ? 512 : 1024, lowPower ? 512 : 1024);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -28;
  sun.shadow.camera.right = sun.shadow.camera.top = 28;
  scene.add(sun);

  const track = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, .25, 0), new THREE.Vector3(18, .55, -38),
    new THREE.Vector3(48, 1.1, -78), new THREE.Vector3(32, .55, -128),
    new THREE.Vector3(-12, .8, -160), new THREE.Vector3(-54, 1.4, -126),
    new THREE.Vector3(-50, .7, -62), new THREE.Vector3(-24, .25, -18)
  ], true, 'catmullrom', .18);

  const terrainGeometry = new THREE.PlaneGeometry(430, 430, lowPower ? 42 : 72, lowPower ? 42 : 72);
  const terrainPosition = terrainGeometry.attributes.position;
  for (let i = 0; i < terrainPosition.count; i += 1) {
    const x = terrainPosition.getX(i), y = terrainPosition.getY(i);
    const radial = Math.min(1, Math.hypot(x, y + 75) / 105);
    const height = (Math.sin(x * .037) * 2.8 + Math.cos(y * .029) * 3.5 + Math.sin((x + y) * .071) * 1.1) * radial;
    terrainPosition.setZ(i, height - .35);
  }
  terrainGeometry.computeVertexNormals();
  const ground = new THREE.Mesh(
    terrainGeometry,
    new THREE.MeshStandardMaterial({ map: forestMap, color: 0x809079, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -.08, -75);
  ground.receiveShadow = true;
  scene.add(ground);

  const shoulder = new THREE.Mesh(makeRoad(track, 5.8, 600), new THREE.MeshStandardMaterial({ color: 0x786f60, roughness: 1 }));
  shoulder.position.y = .015;
  shoulder.receiveShadow = true;
  scene.add(shoulder);
  const road = new THREE.Mesh(makeRoad(track, 4.7, 600), new THREE.MeshStandardMaterial({ map: asphaltMap, normalMap: asphaltNormal, normalScale: new THREE.Vector2(.5, .5), color: 0x727477, roughness: .9, metalness: .01 }));
  road.position.y = .04;
  road.receiveShadow = true;
  scene.add(road);

  const markerGeometry = new THREE.BoxGeometry(.13, .018, 2.3);
  const markerMaterial = new THREE.MeshStandardMaterial({ color: 0xf4e5b6, roughness: .75, emissive: 0x251e0c, emissiveIntensity: .25 });
  const markerCount = lowPower ? 90 : 140;
  const markers = new THREE.InstancedMesh(markerGeometry, markerMaterial, markerCount);
  const dummy = new THREE.Object3D();
  const point = new THREE.Vector3(), tangent = new THREE.Vector3();
  for (let i = 0; i < markerCount; i += 1) {
    const t = i / markerCount;
    track.getPointAt(t, point); track.getTangentAt(t, tangent);
    dummy.position.copy(point).addScaledVector(new THREE.Vector3(0, 1, 0), .09);
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent.clone().normalize());
    dummy.updateMatrix(); markers.setMatrixAt(i, dummy.matrix);
  }
  scene.add(markers);

  const treeCount = lowPower ? 220 : 520;
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(.12, .23, 3.5, 7), new THREE.MeshStandardMaterial({ color: 0x40372e, roughness: 1 }), treeCount);
  const crownGeometry = new THREE.IcosahedronGeometry(1.45, 1);
  crownGeometry.scale(.78, 1.65, .78);
  const crown = new THREE.InstancedMesh(crownGeometry, new THREE.MeshStandardMaterial({ color: 0x18352a, roughness: .96 }), treeCount);
  const crownLight = new THREE.InstancedMesh(crownGeometry, new THREE.MeshStandardMaterial({ color: 0x294b35, roughness: .98 }), treeCount);
  let seed = 1873;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < treeCount; i += 1) {
    const t = random(); track.getPointAt(t, point); track.getTangentAt(t, tangent);
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
    const distance = (7.2 + random() * 46) * (random() > .5 ? 1 : -1);
    const scale = .72 + random() * 1.45;
    const base = point.clone().addScaledVector(side, distance); base.y = 1.55 + Math.sin(base.x * .037) * Math.cos((base.z + 75) * .029) * 1.2;
    dummy.position.copy(base); dummy.rotation.set((random() - .5) * .05, random() * Math.PI, (random() - .5) * .05); dummy.scale.set(scale * (.82 + random() * .25), scale, scale * (.82 + random() * .25)); dummy.updateMatrix(); trunk.setMatrixAt(i, dummy.matrix);
    dummy.position.y += 3.05 * scale; dummy.rotation.y += random(); dummy.scale.set(scale * (.75 + random() * .35), scale * (.85 + random() * .4), scale * (.75 + random() * .35)); dummy.updateMatrix(); crown.setMatrixAt(i, dummy.matrix);
    dummy.position.x += (random() - .5) * .75 * scale; dummy.position.y += 1.2 * scale; dummy.position.z += (random() - .5) * .75 * scale; dummy.scale.multiplyScalar(.72); dummy.updateMatrix(); crownLight.setMatrixAt(i, dummy.matrix);
  }
  trunk.castShadow = crown.castShadow = crownLight.castShadow = !lowPower;
  scene.add(trunk, crown, crownLight);

  const rockCount = lowPower ? 55 : 120;
  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(.65, 0), new THREE.MeshStandardMaterial({ color: 0x676862, roughness: 1 }), rockCount);
  for (let i = 0; i < rockCount; i += 1) {
    const t = random(); track.getPointAt(t, point); track.getTangentAt(t, tangent);
    const side = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), tangent).normalize();
    const distance = (6.4 + random() * 20) * (random() > .5 ? 1 : -1);
    dummy.position.copy(point).addScaledVector(side, distance); dummy.position.y = .15;
    dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
    const size = .25 + random() * 1.1; dummy.scale.set(size * (1 + random()), size * (.45 + random() * .5), size); dummy.updateMatrix(); rocks.setMatrixAt(i, dummy.matrix);
  }
  rocks.castShadow = rocks.receiveShadow = !lowPower; scene.add(rocks);

  const carRoot = new THREE.Group();
  const carLean = new THREE.Group();
  carRoot.add(carLean); scene.add(carRoot);
  let carModel = fallbackCar();
  carLean.add(carModel);
  const wheels = [];
  let destroyed = false;
  const loader = new GLTFLoader();
  loader.load('/assets/models/ferrari.glb', ({ scene: model }) => {
    if (destroyed) {
      model.traverse(object => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach(material => material.dispose()); else object.material?.dispose(); });
      return;
    }
    carLean.remove(carModel);
    carModel.traverse(object => { object.geometry?.dispose(); if (object.material) object.material.dispose?.(); });
    carModel = model;
    carModel.scale.setScalar(1.05);
    carModel.rotation.y = Math.PI;
    carModel.position.y = .12;
    carModel.traverse(object => {
      if (object.isMesh) { object.castShadow = !lowPower; object.receiveShadow = true; }
      if (/wheel|rim/i.test(object.name)) wheels.push(object);
    });
    const body = carModel.getObjectByName('body');
    if (body) body.material = new THREE.MeshPhysicalMaterial({ color: 0x6d0d13, metalness: .78, roughness: .2, clearcoat: 1, clearcoatRoughness: .1 });
    carLean.add(carModel);
  }, undefined, () => { /* The procedural grand-tourer remains visible if the model cannot load. */ });

  const redLightMaterial = new THREE.MeshBasicMaterial({ color: 0xff1f13, toneMapped: false });
  for (const x of [-.67, .67]) {
    const light = new THREE.Mesh(new THREE.BoxGeometry(.34, .13, .035), redLightMaterial);
    light.position.set(x, .72, 2.12); carLean.add(light);
  }
  const tailGlow = new THREE.PointLight(0xff2418, 3.2, 10, 2);
  tailGlow.position.set(0, .55, 2.4); carLean.add(tailGlow);

  const cameraTarget = new THREE.Vector3(), desiredCamera = new THREE.Vector3();
  const currentPoint = new THREE.Vector3(), nextPoint = new THREE.Vector3(), currentTangent = new THREE.Vector3();
  let progress = 0, energy = 0, targetEnergy = 0, frame = 0, last = performance.now(), running = true;
  function setEnergy(value) { targetEnergy = value ? 1 : 0; }
  function render(now) {
    if (!running) return;
    frame = requestAnimationFrame(render);
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    energy = damp(energy, targetEnergy, 2.4, dt);
    if (!reduceMotion) progress = (progress + dt * (.020 + energy * .006)) % 1;
    track.getPointAt(progress, currentPoint); track.getTangentAt(progress, currentTangent).normalize();
    track.getPointAt((progress + .008) % 1, nextPoint);
    carRoot.position.copy(currentPoint).add(new THREE.Vector3(0, .11, 0));
    carRoot.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), currentTangent.clone());
    const curveTurn = currentTangent.clone().cross(nextPoint.clone().sub(currentPoint).normalize()).y;
    carLean.rotation.z = damp(carLean.rotation.z, THREE.MathUtils.clamp(curveTurn * 3.8, -.08, .08), 3, dt);
    carLean.position.y = Math.sin(now * .008) * .006;
    wheels.forEach(wheel => { wheel.rotation.x -= dt * (5.5 + energy); });
    desiredCamera.copy(currentPoint).addScaledVector(currentTangent, -9.5).add(new THREE.Vector3(0, 4.25, 0));
    camera.position.lerp(desiredCamera, 1 - Math.exp(-dt * 4.2));
    cameraTarget.copy(currentPoint).addScaledVector(currentTangent, 10).add(new THREE.Vector3(0, 1.05, 0));
    camera.lookAt(cameraTarget);
    sun.position.copy(currentPoint).add(new THREE.Vector3(-45, 65, 25));
    sun.target.position.copy(currentPoint); scene.add(sun.target);
    renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(render);
  worldElement.classList.add('is-ready');

  const resize = () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(Math.min(devicePixelRatio, lowPower ? 1 : 1.5)); renderer.setSize(innerWidth, innerHeight, false); };
  const visibility = () => { running = !document.hidden; if (running) { last = performance.now(); frame = requestAnimationFrame(render); } else cancelAnimationFrame(frame); };
  const lost = event => { event.preventDefault(); running = false; cancelAnimationFrame(frame); worldElement.classList.remove('is-ready'); };
  const restored = () => { worldElement.classList.add('is-ready'); if (!document.hidden) { running = true; last = performance.now(); frame = requestAnimationFrame(render); } };
  addEventListener('resize', resize, { passive: true }); document.addEventListener('visibilitychange', visibility);
  canvas.addEventListener('webglcontextlost', lost); canvas.addEventListener('webglcontextrestored', restored);
  return { setEnergy, destroy() { destroyed = true; running = false; cancelAnimationFrame(frame); removeEventListener('resize', resize); document.removeEventListener('visibilitychange', visibility); canvas.removeEventListener('webglcontextlost', lost); canvas.removeEventListener('webglcontextrestored', restored); scene.traverse(object => { object.geometry?.dispose(); if (Array.isArray(object.material)) object.material.forEach(material => material.dispose()); else object.material?.dispose(); }); asphaltMap.dispose(); asphaltNormal.dispose(); forestMap.dispose(); scene.environment?.dispose(); renderer.dispose(); } };
}
