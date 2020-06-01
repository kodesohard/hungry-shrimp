<script>
	import Shrimp from './Shrimp.svelte'
    import FeedItems from './FeedItems.svelte'
    import { options } from '../stores.js'
    import { fade, fly } from 'svelte/transition'
    import { afterUpdate } from 'svelte'
    import Icon from '../ui/Icon.svelte'
    import { 
        moveShrimp,
        collision,
        getNewFeedItems,
        isReverse,
        getKeyCodeDirection,
        removeDuplicatePositions
    } from '../../utils/GamePlayUtils'
    
    
    let gameOver = false
    let gameRunning = false
    let intervalId

    let shrimpPositions = [
            { x: 50, y: 350 },
            { x: 25, y: 350 },
            { x: 0, y: 350 }
        ]
    let direction = ''
    let feedItems
    let audio
    let audioSource
    let sound = ''
    
    export let stat

    $: interval = $options.advanced ? 80 : 180
    $: color = stat.lives < 3 ? '#f78a86' : '#86bbf7'
    
    afterUpdate(() => {
        if (sound) {
            audioSource.src = `./${sound}`
            audioSource.type = `audio/${sound.split('.')[1]}`
            audio.load()
            audio.play()
            sound = ''
        }
    })

    function startGame() {
        initialState()
        intervalId = setInterval(() => {
            if (!direction || gameOver) {
                return
            }
            
            shrimpPositions.pop()
            const { ...curHead } = shrimpPositions[0]
            const newHead = moveShrimp(direction, curHead)
            shrimpPositions = [newHead, ...shrimpPositions]
            if (isGameOver()) {
                $options.music = 'theEnd.mp3'
                return
            }
            
            feedItems.forEach((feed, idx) => {
                if (collision(newHead, feed)) {
                    const consumedFeed = feedItems.splice(idx, 1)[0]
                    feedItems = updateFeedItems()
                    
                    setSound(consumedFeed)
                    updateStat(consumedFeed)
                    if (stat.score > 15 && $options.music !== 'terror.mp3') {
                        $options.music = 'terror.mp3'
                    }
                    shrimpPositions = [...shrimpPositions, shrimpPositions[1]]
                }   
            })
               
        }, interval)
    }

    function updateStat(consumedFeed) {
        stat.score = stat.score + (consumedFeed.score || 0)
        stat.lives = stat.lives + (consumedFeed.life || 0)
    }

    function setSound(consumedFeed) {
        if (consumedFeed.score > 0) {
            sound = 'pointsAdded.wav'
        } else if (consumedFeed.life > 0) {
            sound = 'healthAdded.wav'
        } else if (consumedFeed.life < 0) {
            sound = 'healthLost.wav'
        }
    }

    function updateFeedItems() {

        if (feedItems.filter(f => f.score !== -1).length > 8) {
            return []
        }

        let newFeeds = []
        const availableStats = feedItems.reduce((acc, item) => {
            acc.score += (item.score || 0)
            acc.healers += item.life === 1 ? 1 : 0
            return acc
        }, { score: 0, healers: 0 })

        if (stat.score <= 5) {
            newFeeds = getNewFeedItems(1, 1)
        } else if (stat.score > 5 && stat.score <= 10) {
            newFeeds = getNewFeedItems(2, 2)
        } else if (stat.score > 10) {
            newFeeds = getNewFeedItems(3, 3)
            if (stat.lives >= 2) {
                // add poison mushroom
                newFeeds.push(getNewFeedItems(1, 4)[0])
            } 
            if (stat.lives < 3 && availableStats.healers < (3 - stat.lives)) {
                // add healer
                newFeeds.push(getNewFeedItems(1, 5)[0])
            }
        }
        return removeDuplicatePositions([...feedItems, ...newFeeds])
    }

    function isGameOver() {
        const head = shrimpPositions[0]

        if (
            head.x < 0 ||
            head.x > 975 ||
            head.y < 0 ||
            head.y > 675 ||
            shrimpPositions.slice(1).find(s => collision(s, head)) ||
            stat.lives === 0
        ) {
            sound = 'dead.wav'
            gameOver = true
            return true
        }
    }

    function onKeyDown(event) {
        event.preventDefault()
        const newDirection = getKeyCodeDirection(event.keyCode)
        if (newDirection && !isReverse(direction, newDirection)) {
            direction = newDirection
            if (!gameRunning) {
                startGame()
            }
        }
    }

    function initialState() {
        clearInterval(intervalId)
        gameRunning = true
        gameOver = false
        $options.music = 'theBeginning.mp3'
        sound = ''

        stat = { score: 0, lives: 3 }
        direction = 'right' 
        shrimpPositions = [
            { x: 50, y: 350 },
            { x: 25, y: 350 },
            { x: 0, y: 350 }
        ]
        feedItems = getNewFeedItems(1, 1)
    }
</script>

<div class="game-play">
    {#if gameRunning}
        <Shrimp {color} {shrimpPositions} />
        <FeedItems {feedItems}/>
    {/if}
    {#if gameOver}
        <div transition:fly="{{ y: 200, duration: 2000 }}">
            <p>Game Over Loser!</p>
            <p>Score: {stat.score}</p>
            <p>Lives: {stat.lives}</p>
            <Icon cssClass="restart" iconName="restart" on:click={startGame}/>
        </div>
    {:else if !gameRunning}
        <p transition:fade>Press any arrow key to start playing.</p>
    {/if}
</div>
<audio bind:this={audio}>
    <source bind:this={audioSource} src="" type="">
</audio>
<svelte:window on:keydown={onKeyDown} />

<style>
    p {
        font-family: bangers;
		text-align: center;
		font-size: 4em;
        font-weight: 200;
        color: #f5f0f6;
        z-index: 10;
        position: relative;
    }
    
    
</style>