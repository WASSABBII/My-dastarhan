import { Booking } from '../../bookings/entities/booking.entity';

export function operatorAlertTemplate(booking: Booking, reason: string): string {
  return (
    `🚨 *Алерт оператора*\n\n` +
    `Ресторан: ${booking.restaurant?.name}\n` +
    `Бронь: #${booking.id.slice(0, 8)}\n` +
    `Клиент: ${booking.client?.name || 'Гость'} (${booking.client?.phone})\n` +
    `Дата: ${booking.date} в ${booking.time_start}\n\n` +
    `⚠️ Причина: ${reason}`
  );
}
