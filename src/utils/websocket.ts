import { DbManager } from "./indexeddb";

let requests: Array<WebSocketRequest> = [];
let db: DbManager;
let blocked = false;

export class WebSocketManager {
  public ws!: WebSocket;

  constructor() {
    db = new DbManager();
    this.openWebsocket();
  }

  private openWebsocket(): void {
    this.ws = new WebSocket("wss://skyblock-backend.coflnet.com/skyblock");
    this.ws.onmessage = this.onMessage;
    this.ws.onclose = this.onClose;
    this.ws.onerror = this.onError;
    this.ws.onopen = this.onOpen;
  }

  public send(request: WebSocketRequest): void {

    if (this.ws.readyState === WebSocket.OPEN) {
      request.data = btoa(request.data);

      // save and send message
      requests.push(request);
      this.ws.send(JSON.stringify(request));
    } else {
      this.openWebsocket();
      if (WebSocketRequest.errorSending >= 7) {
        request.error({ error: "No Websocket connection available" });
        return;
      }
      WebSocketRequest.errorSending++;
      setTimeout(() => {
        this.send(request);
      }, 1000);
    }

    // search cache (disabled)
    /*
    db.searchCache(request)
      .then((resp: any) => {
        if (resp) {
          request.success(resp);
        } else {
          if (this.ws.readyState === WebSocket.OPEN) {
            request.data = btoa(request.data);

            // save and send message
            requests.push(request);
            this.ws.send(JSON.stringify(request));
          } else {
            this.openWebsocket();
            if (WebSocketRequest.errorSending >= 7) {
              request.error({ error: "No Websocket connection available" });
              return;
            }
            WebSocketRequest.errorSending++;
            setTimeout(() => {
              this.send(request);
            }, 1000);
          }
        }
      })
      .catch((err: any) => {
        //console.warn(err);
      });
      */
  }

  onOpen(): void {
    //nothing to do for now
  }

  onMessage(response: any): void {
    response = JSON.parse(response.data);
    let req = requests.find(e => e.mId === response.mId);
    if (!req) {
      return;
    }
    delete response.mId;
    if (response.type.includes("error")) {
      req.error(response);
    } else {
      // add into local db
      // if user search
      if (req.type === "search") {
        // db.cacheUserSearchResponse(req, response);
      } else if (req.type === "itemDetails") {
        if (!blocked) {
          blocked = true;
          //db.cacheItemDetailsResponse(req, response).then(
          //  () => (blocked = false)
          //);
        }
      } else if (req.type === "validation_error") {
        //
      } else {
        //console.log("currently not possible to catch");
        //console.log(req);
      }
      req.success(response);
    }
  }

  onError(err: any): void {
    //TODO something
    // console.log(err);
  }

  onClose(): void {
    // websocket connection never gets closed
  }
}

export class WebSocketRequest {
  public mId: number;
  public type: any;
  public data: any;
  public success: Function;
  public error: Function;
  public static errorSending: number = 0;
  private static nextmId: number = 0;

  constructor(t: any, d: any, s: Function, e: Function) {
    this.type = t;
    this.data = d;
    this.success = s;
    this.error = e;
    this.mId = ++WebSocketRequest.nextmId;
  }
}
