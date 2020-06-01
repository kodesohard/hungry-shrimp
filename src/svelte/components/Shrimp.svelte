
<script>
export let shrimpPositions
export let color

</script>

{#each shrimpPositions as position, i}
    <div style="background-color: {color}; left: {position.x}px; top: {position.y}px;" class="body" />
{/each}


<style>
    .body {
        background-color: #86bbf7;
        border: black 1px solid;
        border-radius: 8px;
        position: absolute;
        width: 24px;
        height: 24px;
        z-index: 3;
    }

</style>