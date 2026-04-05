import { Booking } from '../../bookings/entities/booking.entity';

export function reminderTemplate(booking: Booking): string {
  const clientName = booking.client?.name || 'Гость';
  return (
    `⏰ *Напоминание о брони*\n\n` +
    `${clientName}, через 1 час ваш столик в *${booking.restaurant?.name}*!\n\n` +
    `🕐 Время: ${booking.time_start}\n` +
    `👥 Гостей: ${booking.guests_count}\n\n` +
    `Подтвердите визит:\n` +
    `✅ Ответьте *ДА* — приду\n` +
    `❌ Ответьте *НЕТ* — не смогу прийти`
  );
}
