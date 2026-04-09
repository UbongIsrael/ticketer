import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: 'scanning', cors: { origin: '*' } })
export class ScanningGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const eventId = client.handshake.query.eventId as string;
    if (eventId) {
      client.join(`event:${eventId}`);
    }
  }

  handleDisconnect(client: Socket) {}

  emitScan(eventId: string, ticketId: string) {
    this.server.to(`event:${eventId}`).emit('ticket_scanned', { ticketId, timestamp: new Date() });
  }
}
