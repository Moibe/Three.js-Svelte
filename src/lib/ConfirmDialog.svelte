<script lang="ts">
  import { confirmStore } from './confirm.svelte';

  const s = $derived(confirmStore.state);

  function onKey(ev: KeyboardEvent) {
    if (!s.open) return;
    if (ev.key === 'Escape') {
      ev.preventDefault();
      ev.stopPropagation();
      confirmStore.cancel();
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      ev.stopPropagation();
      confirmStore.accept();
    }
  }
</script>

<svelte:window on:keydown|capture={onKey} />

{#if s.open}
  <div
    class="backdrop"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    onclick={confirmStore.cancel}
  >
    <div class="card" onclick={(e) => e.stopPropagation()} role="document">
      <div class="stripe"></div>
      <div class="body">
        <div class="head">
          <span class="icon" class:danger={s.danger}>{s.danger ? '⚠' : '?'}</span>
          <h3 id="confirm-title">{s.title}</h3>
        </div>
        <p>{s.message}</p>
        <div class="actions">
          <button class="btn ghost" onclick={confirmStore.cancel}>{s.cancelText}</button>
          <button
            class="btn"
            class:danger={s.danger}
            onclick={confirmStore.accept}
            autofocus
          >
            {s.confirmText}
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(26, 19, 0, 0.55);
    backdrop-filter: blur(4px);
    display: grid;
    place-items: center;
    z-index: 1000;
    animation: fade 0.12s ease-out;
  }

  .card {
    width: min(420px, calc(100vw - 2rem));
    background: #fff7d6;
    border: 2px solid #1a1300;
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 18px 48px rgba(26, 19, 0, 0.35);
    animation: pop 0.16s cubic-bezier(0.2, 0.9, 0.3, 1.2);
  }

  .stripe {
    height: 10px;
    background: repeating-linear-gradient(
      45deg,
      #1a1300 0 14px,
      #ffdd00 14px 28px
    );
  }

  .body {
    padding: 1.1rem 1.25rem 1rem;
  }

  .head {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 0.5rem;
  }

  h3 {
    margin: 0;
    font-size: 1.05rem;
    font-weight: 900;
    letter-spacing: -0.01em;
    color: #1a1300;
  }

  .icon {
    width: 30px;
    height: 30px;
    display: grid;
    place-items: center;
    border-radius: 8px;
    background: #1a1300;
    color: #ffdd00;
    font-weight: 900;
    font-size: 1rem;
  }
  .icon.danger {
    background: #b91c1c;
    color: #fff;
  }

  p {
    margin: 0 0 1rem;
    color: #1a1300;
    font-size: 0.95rem;
    line-height: 1.4;
  }

  .actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
  }

  .btn {
    padding: 0.55rem 1rem;
    border-radius: 10px;
    border: 2px solid #1a1300;
    font-weight: 800;
    font-size: 0.85rem;
    cursor: pointer;
    background: #ffdd00;
    color: #1a1300;
    transition: transform 0.08s, background 0.12s;
  }
  .btn:hover {
    transform: translateY(-1px);
  }
  .btn.danger {
    background: #b91c1c;
    color: #fff;
    border-color: #1a1300;
  }
  .btn.ghost {
    background: transparent;
  }

  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes pop {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(6px);
    }
  }
</style>
