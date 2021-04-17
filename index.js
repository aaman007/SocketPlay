const http = require('http');

// Express
const app = require('express')();
app.get("/", (req, res) => res.sendFile(__dirname + '/index.html'));
app.listen(8001, () => console.log("listening on 8001"));

// WebSocket
const webSocketServer = require('websocket').server;
const httpServer = http.createServer();
httpServer.listen(8000, () => console.log("httpServer listening on 8000"));

// App consts
const METHODS = {
    CONNECT : "connect",
    CREATE : "create",
    JOIN : "join",
    UPDATE : "update",
    PLAY: "play"
}
const colors = {
    0: "orangered",
    1: "yellow",
    2: "blue"
};

// States
const clients = {};
const games = {};

const wsServer = new webSocketServer({
    httpServer: httpServer
});

// Listeners
wsServer.on("request", request => {
    let cid, gid, game, playload;

    let conn = request.accept(null, request.origin);

    const clientId = guid();
    clients[clientId] = {
        conn
    };

    payload = {
        method: METHODS.CONNECT,
        clientId: clientId
    };
    conn.send(JSON.stringify(payload));

    setInterval(updateGameState, 500);

    // Socket Listeners
    conn.on("open", () => console.log("Connection Opened"));

    conn.on("close", () => console.log("Connection Closed"));

    conn.on("message", e => {
        const message = JSON.parse(e.utf8Data);

        switch(message.method){
            case METHODS.CREATE:
                cid = message.clientId;
                gid = guid();
                games[gid] = {
                    id: gid,
                    cells: 20,
                    clients: [],
                    state: {}
                };

                payload = {
                    method: METHODS.CREATE,
                    game: games[gid]
                };

                conn = clients[cid].conn;
                conn.send(JSON.stringify(payload));
                break;

            case METHODS.JOIN:
                cid = message.clientId;
                gid = message.gameId;
                game = games[gid];

                if (!game || !clients[cid] || game.clients.length >= 3) {
                    return;
                }
                game.clients.push({
                    clientId: cid,
                    color: colors[game.clients.length]
                })

                payload = {
                    method: METHODS.JOIN,
                    game: game
                };
                
                game.clients.forEach(c => {
                    clients[c.clientId].conn.send(JSON.stringify(payload));
                })

            case METHODS.PLAY:
                const cellId = message.cellId;
                const color = message.color;
                gid = message.gameId;
                games[gid].state[cellId] = color;
        }
    });
});

const updateGameState = () => {
    for (const g of Object.keys(games)) {
        const game = games[g];
        const payload = {
            method: METHODS.UPDATE,
            game: game
        };

        game.clients.forEach(c => {
            clients[c.clientId].conn.send(JSON.stringify(payload));
        });
    }
}


function S4() {
    return (((1+Math.random())*0x10000)|0).toString(16).substring(1); 
}
 
// then to call it, plus stitch in '4' in the third group
const guid = () => (S4() + S4() + "-" + S4() + "-4" + S4().substr(0,3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
