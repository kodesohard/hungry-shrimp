<script>
	import GamePlay from './components/GamePlay.svelte'
	import Options from './components/Options.svelte'
	import { options } from './stores'
	import Icon from './ui/Icon.svelte'

	let stat = {
		score: 0,
		lives: 3
	}

  // add better graphics
  // add portals
  // deploy it
  // score animation
  // arcade fonts

  
</script>
	
<div class="container">
	<h1>Hungry Shrimp</h1>

	<main style="background-image: url('../../{$options.gameMap}.jpg');">
		<GamePlay bind:stat />
	</main>

	<div class="control-panel">
		<h2>Score {stat.score}</h2>
		<div style="display: block; margin: 6px;">
		{#each Array(stat.lives) as i}
			<Icon iconName="gamepad" />
		{/each}
		</div>
		<Options />
	</div>

</div>

<style>
	.container {
		height: 100%;
		overflow: hidden;
		text-align: center;
	}

	main {
		display: inline-block;
		width: 1000px;
    	height: 700px;
    	border: solid black 1px;
    	position: relative;
    	margin: 20px auto;
		background-image: url("../../giantMonster.jpg");
		background-size: cover;
	}

	.control-panel {
		display: inline-block;
		padding: 25px;
		vertical-align: top;
		border: solid rgb(110, 108, 108) 1px;
		border-radius: 8px;
	    margin-top: 19px;
    	width: 200px;
    	height: 650px;
	}

	h1 {
		color: #ff3e00;
		text-align: center;
		text-transform: uppercase;
		font-size: 4em;
		font-weight: 100;
		margin: auto;
	}

	h2 {
		text-align: center;
		font-size: 1.5em;
		font-weight: 100;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>