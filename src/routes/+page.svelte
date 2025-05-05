<script lang="ts">
    import Scanner from "$lib/components/Scanner.svelte";
    import { onMount } from "svelte";
    
    let isInit = $state(false)
    
    onMount(()=> {
        setTimeout(() => {
            isInit = true
        }, 1000);
    }

    )
</script>
{#if isInit}
<Scanner></Scanner>
{/if}