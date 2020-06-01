<script>
	import GamePlay from './components/GamePlay.svelte'
	import Options from './components/Options.svelte'
	import { options } from './stores'
	import Icon from './ui/Icon.svelte'

	let stat = {
		score: 0,
		lives: 3
	}
  
</script>
	
<div class="container">
	<div class="title">
		<h1>Hungry Shrimp</h1>
	</div>

	<main style="background-image: url('./{$options.gameMap}.jpg');">
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

	.title {
		width: 30%;
		margin: auto;
		text-align: center;
		border: 1px solid; 
		background-color: black;
	}

	main {
		display: inline-block;
		width: 1000px;
    	height: 700px;
    	border: solid black 1px;
    	position: relative;
    	margin: 20px auto;
		background-image: url("./blue.jpg");
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
		font-family: Bangers;
		color: white;
		text-align: center;
		font-size: 6em;
		font-weight: 100;
		margin: auto;
	}

	h2 {
		font-family: Bangers;
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