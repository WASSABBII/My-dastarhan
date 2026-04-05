import { Booking } from '../../bookings/entities/booking.entity';

export function reviewRequestTemplate(booking: Booking): string {
  const clientName = booking.client?.name || 'Гость';
  return (
    `⭐ *Как вам визит?*\n\n` +
    `${clientName}, спасибо что посетили *${booking.restaurant?.name}*!\n\n` +
    `Оставьте отзыв — это поможет нам стать лучше.\n` +
    `Оцените визит от 1 до 5:\n` +
    `😞 1 — Плохо\n` +
    `😕 2 — Не очень\n` +
    `😐 3 — Нормально\n` +
    `😊 4 — Хорошо\n` +
    `🤩 5 — Отлично!`
  );
}
