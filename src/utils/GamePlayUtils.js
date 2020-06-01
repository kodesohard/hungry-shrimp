module.exports = {
    moveShrimp,
    collision,
    getNewFeedItems,
    isReverse,
    getKeyCodeDirection,
    removeDuplicatePositions
}

function moveShrimp(direction, head) {
    switch (direction) {
        case 'left':
            head.x -= 25
            break
        case 'up':
            head.y -= 25
            break
        case 'right':
            head.x += 25
            break
        case 'down':
            head.y += 25
            break
    }
    return head
}

function collision(pos1, pos2) {
    return pos1.x === pos2.x && pos1.y === pos2.y
}

function getNewFeedItems(times, level) {
    switch (level) {
        case 1:
            return Array(times).fill({ score: Math.ceil(Math.random() * 2), ..._generateNewPosition() })
        case 2:
            return Array(Math.ceil(Math.random() * times)).fill({
                score: Math.ceil(Math.random() * 3),
                ..._generateNewPosition()
            })
        case 3:
            return Array(Math.ceil(Math.random() * times)).fill({
                score: Math.ceil(Math.random() * 4),
                ..._generateNewPosition()
            })
        case 4:
            return Array(Math.ceil(Math.random() * times)).fill({
                score: -1,
                life: -1,
                ..._generateNewPosition()
            })
        case 5:
            return Array(Math.ceil(Math.random() * times)).fill({
                score: 0,
                life: 1,
                ..._generateNewPosition()
            })
    }
}

function removeDuplicatePositions(positions) {
    const unique = new Set()

    return positions.filter(p => {
        const duplicate = unique.has(`${p.x}:${p.y}`)
        unique.add(`${p.x}:${p.y}`)
        return !duplicate
    })
}

function _generateNewPosition() {
    return {
        x: Math.floor(Math.random() * 20) * 50,
        y: Math.floor(Math.random() * 14) * 50
    }
}

function isReverse(direction, newDirection) {
    switch (direction) {
        case 'left':
            return newDirection === 'right'
        case 'up':
            return newDirection === 'down'
        case 'right':
            return newDirection === 'left'
        case 'down':
            return newDirection === 'up'
    }
    return false
}

function getKeyCodeDirection(keyCode) {
    switch (keyCode) {
        case 37:
            return 'left'
        case 38:
            return 'up'
        case 39:
            return 'right'
        case 40:
            return 'down'
        default:
            return ''
    }
}
