<script>
    export let iconName
    export let cssClass = ''
    export let style = ''
</script>

<svg {style} class="icon {cssClass}" on:click>
    <use xlink:href="./icons-sprite.svg#{iconName}" />
</svg>

<style>
    .icon {
        width: 28px;
        height: 28px;
        cursor: pointer;
        z-index: 4;
    }

    .restart {
        width: 35px; 
        height: 35px;
        filter: invert(100);
    }

</style>