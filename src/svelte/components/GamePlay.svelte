<script>
	import Shrimp from './Shrimp.svelte'
    import FeedItems from './FeedItems.svelte'
    import { options } from '../stores.js'
    import { fade, fly } from 'svelte/transition'
    import Icon from '../ui/Icon.svelte'
    import { 
        moveShrimp,
        collision,
        getNewFeedItems,
        isReverse,
        getKeyCodeDirection
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
    
    export let stat

    $: interval = $options.advanced ? 80 : 180  

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
                return
            }
            
            feedItems.forEach((feed, idx) => {
                if (collision(newHead, feed)) {
                    console.log('FEEDITEMS111', JSON.stringify(feedItems))
                    const consumedFeed = feedItems.splice(idx, 1, ...generateNewFeedItems())[0]
                    feedItems = feedItems
                    console.log('FEEDITEMS', JSON.stringify(feedItems))
                    stat.score = stat.score + (consumedFeed.score || 0) + 15
                    stat.lives = stat.lives + (consumedFeed.life || 0)
                    if (stat.score > 15 && $options.music !== 'terror.mp3') {
                        $options.music = 'terror.mp3'
                    }
                    shrimpPositions = [...shrimpPositions, shrimpPositions[1]]
                }   
            })
               
        }, interval)
    }

    function generateNewFeedItems() {
        let newFeeds = []
        const availableStats = feedItems.reduce((acc, item) => {
            acc.score += (item.score || 0)
            acc.lives += (item.life || 0)
            return acc
        }, { score: 0, lives: 0 })

        if (stat.score <= 5) {
            newFeeds = getNewFeedItems(1, 1)
        } else if (stat.score > 5 && stat.score <= 10) {
            newFeeds = getNewFeedItems(2, 2)
        } else if (stat.score > 10) {
            newFeeds = getNewFeedItems(3, 3)
            if (stat.lives >= 2) {
                newFeeds.push(getNewFeedItems(1, 4)[0])
            } 
            if (stat.lives < 3) {
                newFeeds.push(getNewFeedItems(1, 5)[0])
            }
        }

        console.log('AVStat', stat, JSON.stringify(availableStats), newFeeds)
        return newFeeds
    }

    function isGameOver() {
        const head = shrimpPositions[0]

        if (
            head.x < 0 ||
            head.x >= 970 ||
            head.y < 0 ||
            head.y >= 690 ||
            shrimpPositions.slice(1).find(s => collision(s, head)) ||
            stat.lives === 0
        ) {
            $options.music = 'theEnd.mp3'
            gameOver = true
            return true
        }
    }

    function onKeyDown(event) {
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
        <Shrimp {shrimpPositions} />
        <FeedItems {feedItems}/>
    {/if}
    {#if gameOver}
        <div transition:fly="{{ y: 200, duration: 2000 }}">
            <p>Game Over!</p>
            <p>Score: {stat.score}</p>
            <p>Lives: {stat.lives}</p>
            <Icon cssClass="restart" iconName="restart" on:click={startGame}/>
        </div>
    {:else if !gameRunning}
        <p transition:fade>Press any arrow key to begin playing.</p>
    {/if}
</div>
<svelte:window on:keydown={onKeyDown} />

<style>
    p {
		text-align: center;
		font-size: 4em;
        font-weight: 200;
        color: #f5f0f6;
        z-index: 10;
        position: relative;
    }
    
    
</style>