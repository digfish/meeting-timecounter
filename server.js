import http from "http";
import fs from "fs";
import url from "url";
import LocalStorage from "node-localstorage"; 
import { WebSocketServer } from "ws";

let start = new Date();
let localStorage = new LocalStorage.LocalStorage('./storage');

const server = http
  .createServer(async (req, res) => {
    console.log(new Date(), "server.js: ", req.method, req.url);
 
    if (req.url.startsWith("/store_state")) {
      const qparams = url.parse(req.url, true).query;
      console.log("/store_state", qparams);
      //persist.setItem(qparams.user, qparams.lasted_secs);
      localStorage.setItem(qparams.user, qparams.lasted_secs);
      res.write("\r\n");
      res.end();
    } else if (req.url.startsWith("/get_state")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      let kv = {}; 
      for (let i=0;i<localStorage.length;i++) {
        let key = localStorage.key(i);
        let value = localStorage.getItem(key);
        kv = { ...kv, [key]: value };
      }
      res.write(JSON.stringify(kv));
      res.write("\r\n");
      res.end();
    } else if(req.url.startsWith("/users")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      let users = [];
      for (let i=0; i <localStorage.length; i++) {
        users.push(localStorage.key(i));
      }
      res.write(JSON.stringify(users));
      res.write("\r\n");
      res.end();
    } else {
      fs.readFile("index.html", (err, data) => {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
      });
    }
  })
  .listen(3000, 
    () => console.log("Took " + ( new Date() - start)  +" milisseconds to load. Listening on port 3000"));

  const wsServer = new WebSocketServer({
    path: "/ws",
    server: server
  });
  let sockets = [];
  wsServer.on("connection", function (socket) {
    console.log("ws connect",socket.address);
    sockets.push(socket);
    // When you receive a message, send that message to every socket.
    socket.on("message", function (msg) {
      console.log("ws message", msg.toString());
      sockets.forEach(s => { if (socket !== s) s.send(msg);});
    });

    // When a socket closes, or disconnects, remove it from the array.
    socket.on("close", function () {
      console.log("ws close");
      sockets = sockets.filter (s => s !== socket);
    });
  });
