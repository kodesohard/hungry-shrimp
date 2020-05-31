
<script>
export let shrimpPositions

</script>

{#each shrimpPositions as position, i}
    <div style="left: {position.x}px; top: {position.y}px;" class="body" />
{/each}


<style>
    .body {
        background-color: rgb(134, 187, 247);
        border: black 1px solid;
        position: absolute;
        width: 24px;
        height: 24px;
        z-index: 3;
    }

</style>