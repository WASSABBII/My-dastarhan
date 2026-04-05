import { WebSocketGateway, WebSocketServer, OnGatewayConnection } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/bookings', cors: { origin: '*' } })
export class BookingsGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const restaurantId = client.handshake.query['restaurantId'] as string;
    const date = client.handshake.query['date'] as string;
    if (restaurantId && date) {
      client.join(`${restaurantId}:${date}`);
    }
  }

  notifyTableStatusChanged(payload: {
    restaurantId: string;
    tableId: string;
    date: string;
    time: string;
    status: 'free' | 'busy';
  }) {
    this.server
      .to(`${payload.restaurantId}:${payload.date}`)
      .emit('table:status-changed', payload);
  }
}
