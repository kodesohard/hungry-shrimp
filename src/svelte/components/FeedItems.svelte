<script>
    import Icon from '../ui/Icon.svelte'

    export let feedItems
    
    let feedMap = {
        '-1': 'mushroom',
        0: 'gamepad',
        1: 'shrimp-1',
        2: 'gold-shrimp-1',
        3: 'shrimp-pair',
        4: 'lobster',
    }

</script>

{#each feedItems as feed}
    <div class="feed" style="left: {feed.x}px; top: {feed.y}px;">
        <Icon iconName={feedMap[feed.score]} />
    </div>
{/each}

<style>
    .feed {
        position: absolute;
    }
</style>