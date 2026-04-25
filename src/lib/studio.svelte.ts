export type PrimitiveKind = 'box' | 'sphere' | 'cylinder' | 'torus' | 'cone';

export type Shape = {
  id: string;
  kind: PrimitiveKind;
  color: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
};

const palette = ['#1a1300', '#ff5722', '#0ea5e9', '#16a34a', '#a855f7', '#ec4899'];

function makeShape(kind: PrimitiveKind): Shape {
  return {
    id: crypto.randomUUID(),
    kind,
    color: palette[Math.floor(Math.random() * palette.length)],
    position: { x: (Math.random() - 0.5) * 2, y: 0, z: (Math.random() - 0.5) * 2 },
    scale: { x: 1, y: 1, z: 1 },
    rotation: { x: 0, y: 0, z: 0 }
  };
}

const STORAGE_KEY = 'threejs-svelte:studio:v1';

function loadInitial(): { shapes: Shape[]; selectedId: string | null } {
  if (typeof localStorage === 'undefined') return { shapes: [], selectedId: null };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { shapes: [], selectedId: null };
    const parsed = JSON.parse(raw);
    return {
      shapes: Array.isArray(parsed.shapes) ? parsed.shapes : [],
      selectedId: typeof parsed.selectedId === 'string' ? parsed.selectedId : null
    };
  } catch {
    return { shapes: [], selectedId: null };
  }
}

function createStudio() {
  const initial = loadInitial();
  let shapes = $state<Shape[]>(initial.shapes);
  let selectedId = $state<string | null>(initial.selectedId);

  if (typeof window !== 'undefined') {
    $effect.root(() => {
      $effect(() => {
        const snapshot = JSON.stringify({ shapes, selectedId });
        try {
          localStorage.setItem(STORAGE_KEY, snapshot);
        } catch {
          // quota exceeded or storage disabled — ignore
        }
      });
    });
  }

  return {
    get shapes() {
      return shapes;
    },
    get selectedId() {
      return selectedId;
    },
    get selected() {
      return shapes.find((s) => s.id === selectedId) ?? null;
    },
    add(kind: PrimitiveKind) {
      const shape = makeShape(kind);
      shapes.push(shape);
      selectedId = shape.id;
    },
    select(id: string | null) {
      selectedId = id;
    },
    remove(id: string) {
      shapes = shapes.filter((s) => s.id !== id);
      if (selectedId === id) selectedId = null;
    },
    clear() {
      shapes = [];
      selectedId = null;
    },
    serialize(): string {
      return JSON.stringify({ version: 1, shapes }, null, 2);
    },
    load(raw: unknown): { ok: true; count: number } | { ok: false; error: string } {
      try {
        const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!data || !Array.isArray(data.shapes)) {
          return { ok: false, error: 'JSON inválido: falta el arreglo "shapes".' };
        }
        const validKinds: PrimitiveKind[] = ['box', 'sphere', 'cylinder', 'torus', 'cone'];
        const next: Shape[] = [];
        for (const s of data.shapes) {
          if (!s || !validKinds.includes(s.kind)) continue;
          next.push({
            id: typeof s.id === 'string' ? s.id : crypto.randomUUID(),
            kind: s.kind,
            color: typeof s.color === 'string' ? s.color : '#1a1300',
            position: {
              x: Number(s.position?.x) || 0,
              y: Number(s.position?.y) || 0,
              z: Number(s.position?.z) || 0
            },
            scale: {
              x: Number(s.scale?.x) || 1,
              y: Number(s.scale?.y) || 1,
              z: Number(s.scale?.z) || 1
            },
            rotation: {
              x: Number(s.rotation?.x) || 0,
              y: Number(s.rotation?.y) || 0,
              z: Number(s.rotation?.z) || 0
            }
          });
        }
        shapes = next;
        selectedId = null;
        return { ok: true, count: next.length };
      } catch (e) {
        return { ok: false, error: e instanceof Error ? e.message : 'Error al parsear JSON.' };
      }
    }
  };
}

export const studio = createStudio();
