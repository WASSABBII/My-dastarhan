import { Booking } from '../../bookings/entities/booking.entity';

export function bookingConfirmedTemplate(booking: Booking): string {
  const clientName = booking.client?.name || 'Гость';
  return (
    `✅ *Бронь подтверждена!*\n\n` +
    `Привет, ${clientName}!\n` +
    `Ваш столик забронирован в ресторане *${booking.restaurant?.name}*.\n\n` +
    `📅 Дата: ${booking.date}\n` +
    `🕐 Время: ${booking.time_start} — ${booking.time_end}\n` +
    `👥 Гостей: ${booking.guests_count}\n\n` +
    `Для отмены брони ответьте *ОТМЕНА*`
  );
}
