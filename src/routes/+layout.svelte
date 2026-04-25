<script lang="ts">
  import '../app.css';
  import ConfirmDialog from '$lib/ConfirmDialog.svelte';
  let { children } = $props();
</script>

{@render children()}
<ConfirmDialog />
