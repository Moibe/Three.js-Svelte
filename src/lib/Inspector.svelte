<script lang="ts">
  import { studio, type PrimitiveKind, type Shape } from './studio.svelte';
  import { confirmStore } from './confirm.svelte';

  async function confirmRemove(shape: Shape) {
    const ok = await confirmStore.ask({
      title: 'Eliminar figura',
      message: `¿Eliminar la figura "${shape.kind}"? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      danger: true
    });
    if (ok) studio.remove(shape.id);
  }
  async function confirmClear() {
    if (studio.shapes.length === 0) return;
    const ok = await confirmStore.ask({
      title: 'Vaciar escena',
      message: `Se eliminarán ${studio.shapes.length} figura${studio.shapes.length === 1 ? '' : 's'}. ¿Continuar?`,
      confirmText: 'Vaciar',
      danger: true
    });
    if (ok) studio.clear();
  }

  const kinds: { kind: PrimitiveKind; label: string; icon: string }[] = [
    { kind: 'box', label: 'Cubo', icon: '◼' },
    { kind: 'sphere', label: 'Esfera', icon: '●' },
    { kind: 'cylinder', label: 'Cilindro', icon: '▮' },
    { kind: 'cone', label: 'Cono', icon: '▲' },
    { kind: 'torus', label: 'Toro', icon: '◯' }
  ];

  let fileInput: HTMLInputElement;

  function exportScene() {
    const json = studio.serialize();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    a.href = url;
    a.download = `escena-3d-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function onFileChosen(ev: Event) {
    const input = ev.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    const text = await file.text();

    if (studio.shapes.length > 0) {
      const ok = await confirmStore.ask({
        title: 'Importar escena',
        message: `Se reemplazarán las ${studio.shapes.length} figuras actuales por las del archivo. ¿Continuar?`,
        confirmText: 'Importar',
        danger: true
      });
      if (!ok) return;
    }

    const result = studio.load(text);
    if (!result.ok) {
      await confirmStore.ask({
        title: 'Error al importar',
        message: result.error,
        confirmText: 'Entendido',
        cancelText: 'Cerrar',
        danger: false
      });
    }
  }
</script>

<aside class="panel">
  <section>
    <h2>Archivo</h2>
    <div class="io">
      <button class="io-btn" onclick={exportScene} disabled={studio.shapes.length === 0}>
        <span>⬇</span><span>Exportar</span>
      </button>
      <button class="io-btn" onclick={() => fileInput.click()}>
        <span>⬆</span><span>Importar</span>
      </button>
      <input
        bind:this={fileInput}
        type="file"
        accept="application/json,.json"
        onchange={onFileChosen}
        hidden
      />
    </div>
  </section>

  <section>
    <h2>Crear</h2>
    <div class="grid">
      {#each kinds as k (k.kind)}
        <button onclick={() => studio.add(k.kind)} title={k.label}>
          <span class="icon">{k.icon}</span>
          <span>{k.label}</span>
        </button>
      {/each}
    </div>
  </section>

  <section>
    <h2>Escena <span class="count">{studio.shapes.length}</span></h2>
    {#if studio.shapes.length === 0}
      <p class="hint">Agrega una figura para empezar.</p>
    {:else}
      <ul class="list">
        {#each studio.shapes as shape (shape.id)}
          <li class:selected={shape.id === studio.selectedId}>
            <button class="row" onclick={() => studio.select(shape.id)}>
              <span class="dot" style="background:{shape.color}"></span>
              <span>{shape.kind}</span>
            </button>
            <button class="del" onclick={() => confirmRemove(shape)} title="Eliminar">✕</button>
          </li>
        {/each}
      </ul>
      <button class="clear" onclick={confirmClear}>Vaciar escena</button>
    {/if}
  </section>

  {#if studio.selected}
    {@const s = studio.selected}
    <section class="props">
      <h2>Propiedades</h2>

      <label class="field">
        <span>Color</span>
        <input type="color" bind:value={s.color} />
      </label>

      <fieldset>
        <legend>Posición</legend>
        {#each ['x', 'y', 'z'] as axis}
          <label>
            <span>{axis}</span>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.05"
              bind:value={s.position[axis as 'x' | 'y' | 'z']}
            />
            <output>{s.position[axis as 'x' | 'y' | 'z'].toFixed(2)}</output>
          </label>
        {/each}
      </fieldset>

      <fieldset>
        <legend>Escala</legend>
        {#each ['x', 'y', 'z'] as axis}
          <label>
            <span>{axis}</span>
            <input
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              bind:value={s.scale[axis as 'x' | 'y' | 'z']}
            />
            <output>{s.scale[axis as 'x' | 'y' | 'z'].toFixed(2)}</output>
          </label>
        {/each}
      </fieldset>

      <fieldset>
        <legend>Rotación</legend>
        {#each ['x', 'y', 'z'] as axis}
          <label>
            <span>{axis}</span>
            <input
              type="range"
              min={-Math.PI}
              max={Math.PI}
              step="0.01"
              bind:value={s.rotation[axis as 'x' | 'y' | 'z']}
            />
            <output>{s.rotation[axis as 'x' | 'y' | 'z'].toFixed(2)}</output>
          </label>
        {/each}
      </fieldset>
    </section>
  {/if}
</aside>

<style>
  .panel {
    background: rgba(255, 255, 255, 0.6);
    border: 1px solid rgba(26, 19, 0, 0.2);
    border-radius: 16px;
    padding: 1rem;
    backdrop-filter: blur(8px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 0.78rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .count {
    background: #1a1300;
    color: #ffdd00;
    border-radius: 999px;
    padding: 0.05rem 0.5rem;
    font-size: 0.7rem;
  }

  .hint {
    font-size: 0.85rem;
    opacity: 0.65;
    margin: 0;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.4rem;
  }

  .grid button {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: 0.55rem 0.3rem;
    background: #1a1300;
    color: #ffdd00;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
    font-size: 0.72rem;
    transition: transform 0.1s;
  }
  .grid button:hover {
    transform: translateY(-2px);
  }
  .icon {
    font-size: 1.1rem;
  }

  .list {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    max-height: 180px;
    overflow-y: auto;
  }
  .list li {
    display: flex;
    align-items: center;
    border-radius: 8px;
    background: rgba(26, 19, 0, 0.06);
  }
  .list li.selected {
    background: #1a1300;
    color: #ffdd00;
  }
  .row {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.6rem;
    background: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    text-align: left;
    text-transform: capitalize;
    font: inherit;
  }
  .dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.3);
  }
  .del {
    background: transparent;
    border: none;
    color: inherit;
    opacity: 0.6;
    cursor: pointer;
    padding: 0.4rem 0.6rem;
  }
  .del:hover {
    opacity: 1;
  }
  .clear {
    width: 100%;
    padding: 0.4rem;
    background: transparent;
    border: 1px dashed rgba(26, 19, 0, 0.4);
    border-radius: 8px;
    cursor: pointer;
    font-size: 0.78rem;
  }

  .props fieldset {
    border: 1px solid rgba(26, 19, 0, 0.2);
    border-radius: 10px;
    padding: 0.5rem 0.7rem;
    margin: 0 0 0.5rem;
  }
  .props legend {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0 0.3rem;
  }
  .props label {
    display: grid;
    grid-template-columns: 14px 1fr 42px;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.78rem;
  }
  .props label span {
    font-weight: 700;
    text-transform: uppercase;
  }
  .props output {
    font-variant-numeric: tabular-nums;
    text-align: right;
    font-size: 0.72rem;
    opacity: 0.75;
  }
  .field {
    display: flex !important;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.5rem;
  }
  .field input[type='color'] {
    width: 48px;
    height: 28px;
    border: none;
    background: transparent;
    cursor: pointer;
  }

  input[type='range'] {
    accent-color: #1a1300;
  }

  .io {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.4rem;
  }
  .io-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    padding: 0.5rem;
    background: transparent;
    color: #1a1300;
    border: 2px solid #1a1300;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 800;
    font-size: 0.78rem;
    transition: background 0.12s, color 0.12s;
  }
  .io-btn:hover:not(:disabled) {
    background: #1a1300;
    color: #ffdd00;
  }
  .io-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
