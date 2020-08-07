const socket = () => {
  let socket = null;

  const create = (protocol = 'ws', hostname, port, endpoint) => {
    try {
      socket = new WebSocket(`${protocol}://${hostname}:${port}${endpoint}`);

      socket.onOpen = (event) => {
        console.log('Connection to websocket has been established');
      };

      socket.onmessage = (event) => {
        let message = event.data;
        let div = document.getElementById('output');
        div.innerHTML += `<p>${message}</p>`;
      }
    } catch (error) {
      console.log(error);
    }
  };

  return {
    init: create
  }
}