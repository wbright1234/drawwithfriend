const WebSocket = require('ws');
const pool = require('../db_connection/connection.js').pool;
var wss = null;

createWSS = (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer });
  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('close', () => {
      console.log(`Websocket client ${ws.id} is disconnected`);
      console.log(`Websocket client ${ws.matchedimei} is disconnected`);
      console.log(`Websocket client ${ws.drawmatchid} is disconnected`);
      wss.clients.forEach(ws1 => {
          if (ws1.id == ws.matchedimei) {
            var message = {
                type : 'friendLeave',
                matchedimei : ws.id,
                drawmatchid : ws.drawmatchid
            };
            ws1.send(JSON.stringify(message));
          }
      });
    });

    ws.on('message', (message) => {
      console.log(`Websocket message arrived: ${message}`);
      var m = JSON.parse(message);
      switch (m.type) {
        case 'join':
          closeWSClientsWithIMEI(m.imei);
          ws.id = m.imei;
          ws.matchedimei = 0;
          ws.drawmatchid = 0;
          console.log(`Websocket client with imei ${ws.id} is connected`);
          break;
        case 'unjoin':
          closeWSClientsWithIMEI(m.imei);
          break;
        case 'drawSticker':
          wss.clients.forEach(w => {
            if (w.id == m.matchedimei) {
              w.send(JSON.stringify({
                type: 'drawSticker',
                drawmatchid: m.drawmatchid,
                stickerid: m.stickerid
              }));
              return true;
            }
          })
          break;
        default:
          break;
      }
    });

    ws.on('error', (error) => {
      console.log(`Websocket client ${ws.id} connect error ${error}`);
    });
  });

  setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) return ws.terminate();
      ws.isAlive = false;
      ws.ping(null, false, () => {
      });
    });
  }, 30000);
}

sendOppositeMsg = (imei, message) => {
  wss.clients.forEach(ws => {
      if (ws.id == imei) {
        ws.send(JSON.stringify(message));
      }
  })
}

closeWSClientsWithIMEI = (imei) => {
  wss.clients.forEach(ws => {
    if (ws.id == imei) {
      ws.terminate();
    }
  })
}

setWSIDs = (imei, matchedimei, drawmatchid) => {
  wss.clients.forEach(ws => {
    if (ws.id == imei) {
      ws.matchedimei = matchedimei;
      ws.drawmatchid = drawmatchid;
    }
  })
}

exports.wss = wss;
exports.createWSS = createWSS;
exports.sendOppositeMsg = sendOppositeMsg;
exports.setWSIDs = setWSIDs;
