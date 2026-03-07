import { gameEngine } from '../utils/gameEngine'

const peers: Set<any> = new Set()

// Monkey patch the broadcast method from the instantiated singleton
gameEngine.broadcast = (roomId: string, eventObj: any) => {
    const msg = JSON.stringify(eventObj)
    for (const peer of peers) {
        peer.send(msg)
    }
}

export default defineWebSocketHandler({
    open(peer) {
        console.log('[ws] peer connected', peer.id)
        peers.add(peer)
    },
    message(peer, message) {
        console.log('[ws] message log', peer.id, message.text())
    },
    close(peer, event) {
        console.log('[ws] peer disconnected', peer.id)
        peers.delete(peer)
    },
    error(peer, error) {
        console.log('[ws] error', peer.id, error)
    }
})
