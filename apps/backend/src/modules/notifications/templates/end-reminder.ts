import { Booking } from '../../bookings/entities/booking.entity';

export function endReminderTemplate(booking: Booking): string {
  const clientName = booking.client?.name || 'Гость';
  return (
    `🔔 *Время брони заканчивается*\n\n` +
    `${clientName}, через 15 минут заканчивается время вашего столика в *${booking.restaurant?.name}*.\n\n` +
    `Что будете делать?\n` +
    `🪑 Ответьте *ОСТАЮСЬ* — продлим время\n` +
    `🚪 Ответьте *УХОДИМ* — спасибо за визит!\n` +
    `👨‍👩‍👧 Если вас стало больше — ответьте *НАС СТАЛО БОЛЬШЕ X* (где X — сколько вас)`
  );
}
