<script lang="ts">
  import Scene from '$lib/Scene.svelte';
  import Inspector from '$lib/Inspector.svelte';
</script>

<main>
  <header>
    <span class="badge">⚠ 3D STUDIO</span>
    <h1>Three.js × Svelte</h1>
    <p>Crea figuras 3D y modifícalas en el navegador.</p>
  </header>

  <section class="stage">
    <Scene />
  </section>

  <Inspector />
</main>

<style>
  main {
    display: grid;
    grid-template-columns: 1fr 340px;
    grid-template-rows: auto 1fr;
    gap: 1rem;
    padding: 1.25rem;
    height: 100vh;
  }

  header {
    grid-column: 1 / -1;
    display: flex;
    align-items: baseline;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .badge {
    background: #1a1300;
    color: #ffdd00;
    padding: 0.35rem 0.7rem;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.8rem;
    letter-spacing: 0.08em;
  }

  h1 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 900;
    letter-spacing: -0.02em;
  }

  header p {
    margin: 0;
    opacity: 0.75;
    font-weight: 500;
  }

  .stage {
    background: rgba(26, 19, 0, 0.08);
    border: 2px dashed rgba(26, 19, 0, 0.35);
    border-radius: 16px;
    overflow: hidden;
    backdrop-filter: blur(2px);
  }
</style>
