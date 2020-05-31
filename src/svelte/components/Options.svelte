<script>
    import { options } from '../stores.js'
    import { afterUpdate } from 'svelte'
    import Icon from '../ui/Icon.svelte'

    let audio
    let audioSource
    let muted = false

    $: soundIcon = muted ? 'sound-muted' : 'sound-on'

    afterUpdate(() => {
        if ($options.music) {
            audioSource.src = `../../audio/${$options.music}`
            audioSource.type = `audio/${$options.music.split('.')[1]}`
            audio.load()
            audio.play()
        }
    })
</script>

<div class="tab">
    <button class:active="{$options.gameMap === '3HeadedMonster'}" on:click={() => $options.gameMap = '3HeadedMonster'}>Koro Sea</button>
    <button class:active="{$options.gameMap === 'corals'}" on:click={() => $options.gameMap = 'corals'}>Coral Sea</button>
    <button class:active="{$options.gameMap === 'giantMonster'}" on:click={() => $options.gameMap = 'giantMonster'}>Red Sea</button>
</div>


<div class="toggle">
    <label class="switch">
        <input type="checkbox" on:click={() => $options = { ...$options, advanced: !$options.advanced }} />
        <span class="slider"></span>
    </label>
    <label>{$options.advanced ? 'Advanced' : 'Easy'}</label>
</div>

<audio bind:this={audio} {muted} autoplay loop>
    <source bind:this={audioSource} src="" type="">
</audio>

<Icon style="margin-top: 15px;" iconName={soundIcon} on:click={() => muted = !muted}/>

<style>
    .toggle {
        display: block;
    }

    .switch {
        position: relative;
        display: inline-block;
        width: 60px;
        height: 34px;
    }

    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        -webkit-transition: .4s;
        transition: .4s;
    }

    .slider:before {
        position: absolute;
        content: "";
        height: 26px;
        width: 26px;
        left: 4px;
        bottom: 4px;
        background-color: white;
        -webkit-transition: .4s;
        transition: .4s;
    }

    input:checked + .slider {
        background-color: #2196F3;
    }

    input:focus + .slider {
        box-shadow: 0 0 1px #2196F3;
    }

    input:checked + .slider:before {
        -webkit-transform: translateX(26px);
        -ms-transform: translateX(26px);
        transform: translateX(26px);
    }

    .tab {
        display: block;
        float: left;
        border-radius: 5px;
        border: 1px solid #ccc;
        background-color: #f1f1f1;
        width: auto;
        height: auto;
    }

    .tab button {
        display: block;
        background-color: inherit;
        color: black;
        width: 100%;
        border: none;
        outline: none;
        text-align: left;
        cursor: pointer;
        transition: 0.4s;
        font-size: 17px;
        margin-bottom: auto;
    }

    .tab button:hover {
        background-color: #a5cff0;
    }

    .tab button.active {
        background-color: #2196F3;
    }

</style>