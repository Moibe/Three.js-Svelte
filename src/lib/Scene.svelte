<script lang="ts">
  import { onMount } from 'svelte';
  import * as THREE from 'three';
  import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
  import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
  import { studio, type Shape, type PrimitiveKind } from './studio.svelte';
  import { confirmStore } from './confirm.svelte';

  let container: HTMLDivElement;

  function buildGeometry(kind: PrimitiveKind): THREE.BufferGeometry {
    switch (kind) {
      case 'box':
        return new THREE.BoxGeometry(1, 1, 1);
      case 'sphere':
        return new THREE.SphereGeometry(0.6, 32, 32);
      case 'cylinder':
        return new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32);
      case 'torus':
        return new THREE.TorusGeometry(0.5, 0.2, 16, 64);
      case 'cone':
        return new THREE.ConeGeometry(0.6, 1.2, 32);
    }
  }

  onMount(() => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(4, 3.5, 5);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0.5, 0);

    scene.add(new THREE.AmbientLight(0xfff37a, 0.6));
    const key = new THREE.DirectionalLight(0xffdd00, 1.4);
    key.position.set(5, 8, 4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xffffff, 0.5);
    rim.position.set(-4, 3, -3);
    scene.add(rim);

    const grid = new THREE.GridHelper(10, 10, 0x1a1300, 0x806400);
    (grid.material as THREE.Material).opacity = 0.5;
    (grid.material as THREE.Material).transparent = true;
    scene.add(grid);

    const meshes = new Map<string, THREE.Mesh>();
    const selectionRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.03, 8, 48),
      new THREE.MeshBasicMaterial({ color: 0x1a1300 })
    );
    selectionRing.rotation.x = Math.PI / 2;
    selectionRing.visible = false;
    scene.add(selectionRing);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    const transform = new TransformControls(camera, renderer.domElement);
    transform.setSize(0.9);
    const transformHelper = transform.getHelper();
    scene.add(transformHelper);
    transformHelper.visible = false;

    transform.addEventListener('dragging-changed', (e) => {
      controls.enabled = !e.value;
    });
    transform.addEventListener('objectChange', () => {
      const sel = studio.selected;
      const obj = transform.object;
      if (!sel || !obj) return;
      sel.position.x = obj.position.x;
      sel.position.y = obj.position.y;
      sel.position.z = obj.position.z;
      sel.rotation.x = obj.rotation.x;
      sel.rotation.y = obj.rotation.y;
      sel.rotation.z = obj.rotation.z;
      sel.scale.x = obj.scale.x;
      sel.scale.y = obj.scale.y;
      sel.scale.z = obj.scale.z;
    });

    function attachGizmo(id: string) {
      const m = meshes.get(id);
      if (!m) return;
      transform.attach(m);
      transformHelper.visible = true;
    }
    function detachGizmo() {
      transform.detach();
      transformHelper.visible = false;
    }

    function syncMesh(shape: Shape) {
      let mesh = meshes.get(shape.id);
      if (!mesh) {
        mesh = new THREE.Mesh(
          buildGeometry(shape.kind),
          new THREE.MeshStandardMaterial({ color: shape.color, metalness: 0.2, roughness: 0.45 })
        );
        mesh.userData.id = shape.id;
        meshes.set(shape.id, mesh);
        scene.add(mesh);
      }
      (mesh.material as THREE.MeshStandardMaterial).color.set(shape.color);
      mesh.position.set(shape.position.x, shape.position.y, shape.position.z);
      mesh.scale.set(shape.scale.x, shape.scale.y, shape.scale.z);
      mesh.rotation.set(shape.rotation.x, shape.rotation.y, shape.rotation.z);
    }

    function syncAll() {
      const ids = new Set(studio.shapes.map((s) => s.id));
      for (const [id, mesh] of meshes) {
        if (!ids.has(id)) {
          scene.remove(mesh);
          mesh.geometry.dispose();
          (mesh.material as THREE.Material).dispose();
          meshes.delete(id);
        }
      }
      for (const shape of studio.shapes) syncMesh(shape);

      const sel = studio.selected;
      if (sel) {
        const m = meshes.get(sel.id)!;
        selectionRing.visible = true;
        selectionRing.position.copy(m.position);
      } else {
        selectionRing.visible = false;
        detachGizmo();
      }

      if (transform.object && (!sel || transform.object.userData.id !== sel.id)) {
        detachGizmo();
      }
    }

    const stopEffects = $effect.root(() => {
      $effect(() => {
        studio.shapes.forEach((s) => {
          s.color;
          s.position.x;
          s.position.y;
          s.position.z;
          s.scale.x;
          s.scale.y;
          s.scale.z;
          s.rotation.x;
          s.rotation.y;
          s.rotation.z;
        });
        studio.selectedId;
        syncAll();
      });
    });

    function pickMesh(ev: MouseEvent): string | null {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects([...meshes.values()], false);
      return hits.length ? (hits[0].object.userData.id as string) : null;
    }

    function onClick(ev: MouseEvent) {
      if (transform.dragging) return;
      const id = pickMesh(ev);
      studio.select(id);
    }

    function onDblClick(ev: MouseEvent) {
      const id = pickMesh(ev);
      if (id) {
        studio.select(id);
        attachGizmo(id);
      } else {
        detachGizmo();
      }
    }

    function onKey(ev: KeyboardEvent) {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase();
      const typing = tag === 'input' || tag === 'textarea' || tag === 'select';

      if (ev.key === 'Escape') detachGizmo();
      else if (!typing && (ev.key === 'Delete' || ev.key === 'Backspace')) {
        const sel = studio.selected;
        if (!sel) return;
        ev.preventDefault();
        const id = sel.id;
        const kind = sel.kind;
        confirmStore
          .ask({
            title: 'Eliminar figura',
            message: `¿Eliminar la figura "${kind}"? Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            danger: true
          })
          .then((ok) => {
            if (ok) {
              detachGizmo();
              studio.remove(id);
            }
          });
      } else if (!typing && (ev.key === 'w' || ev.key === 'W')) transform.setMode('translate');
      else if (!typing && (ev.key === 'e' || ev.key === 'E')) transform.setMode('rotate');
      else if (!typing && (ev.key === 'r' || ev.key === 'R')) transform.setMode('scale');
    }

    renderer.domElement.addEventListener('pointerdown', onClick);
    renderer.domElement.addEventListener('dblclick', onDblClick);
    window.addEventListener('keydown', onKey);

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    let raf = 0;
    const tick = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      stopEffects();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
      renderer.domElement.removeEventListener('pointerdown', onClick);
      renderer.domElement.removeEventListener('dblclick', onDblClick);
      transform.dispose();
      controls.dispose();
      for (const mesh of meshes.values()) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  });
</script>

<div bind:this={container} class="scene"></div>

<style>
  .scene {
    width: 100%;
    height: 100%;
    display: block;
    cursor: grab;
  }
  .scene:active {
    cursor: grabbing;
  }
</style>
