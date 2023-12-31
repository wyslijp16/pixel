/* @flow
 *
 * Serverside communication with websockets.
 * In general all values that get broadcasted here have to be sanitized already.
 *
 */

import OnlineCounter from './packets/OnlineCounter';
import PixelUpdate from './packets/PixelUpdateServer';


class WebSockets {
  listeners: Array<Object>;

  constructor() {
    this.listeners = [];
  }

  addListener(listener) {
    this.listeners.push(listener);
  }

  /*
   * broadcast message via websocket
   * @param message Message to send
   */
  broadcast(message: Buffer) {
    this.listeners.forEach(
      (listener) => listener.broadcast(message),
    );
  }

  /*
   * broadcast pixel message via websocket
   * @param canvasIdent ident of canvas
   * @param i x coordinates of chunk
   * @param j y coordinates of chunk
   * @param offset offset of pixel within this chunk
   * @param color colorindex
   */
  broadcastPixel(
    canvasId: number,
    i: number,
    j: number,
    offset: number,
    color: number,
  ) {
    const chunkid = (i << 8) | j;
    const buffer = PixelUpdate.dehydrate(i, j, offset, color);
    this.listeners.forEach(
      (listener) => listener.broadcastPixelBuffer(canvasId, chunkid, buffer),
    );
  }

  /*
   * broadcast chat message
   * @param name chatname
   * @param message Message to send
   * @param sendapi If chat message should get boradcasted to api websockets
   *                (usefull if the api is supposed to not answer to its own messages)
   */
  broadcastChatMessage(
    name: string,
    message: string,
    country: string,
    channelId: number = 0,
    sendapi: boolean = true,
  ) {
    country = country || 'xx';
    this.listeners.forEach(
      (listener) => listener.broadcastChatMessage(
        name,
        message,
        country,
        channelId,
        sendapi,
      ),
    );
  }

  /*
   * broadcast minecraft linking to API
   * @param name pixelplanetname
   * @param minecraftid minecraftid
   * @param accepted If link request got accepted
   */
  broadcastMinecraftLink(
    name: string,
    minecraftid: string,
    accepted: boolean,
  ) {
    this.listeners.forEach(
      (listener) => listener.broadcastMinecraftLink(
        name,
        minecraftid,
        accepted,
      ),
    );
  }

  /*
   * Notify user on websocket that he should rerequest api/message
   * Currently just used for getting minecraft link message.
   */
  notifyChangedMe(name: string) {
    this.listeners.forEach(
      (listener) => listener.notifyChangedMe(name),
    );
  }

  /*
   * broadcast mc tp request to API
   * @param minecraftid minecraftid
   * @param x x coords
   * @param y y coords
   */
  broadcastMinecraftTP(minecraftid, x, y) {
    this.listeners.forEach(
      (listener) => listener.broadcastMinecraftTP(minecraftid, x, y),
    );
  }

  /*
   * broadcast online counter
   * @param online Number of users online
   */
  broadcastOnlineCounter(online: number) {
    const buffer = OnlineCounter.dehydrate({ online });
    this.listeners.forEach(
      (listener) => listener.broadcastOnlineCounter(buffer),
    );
  }
}

const webSockets = new WebSockets();
export default webSockets;
