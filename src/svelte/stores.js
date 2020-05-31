import { writable } from 'svelte/store'

export const options = writable({
    advanced: false,
    gameMap: '3HeadedMonster',
    music: ''
})
