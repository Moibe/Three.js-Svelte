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

function createStudio() {
  let shapes = $state<Shape[]>([]);
  let selectedId = $state<string | null>(null);

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
    }
  };
}

export const studio = createStudio();
