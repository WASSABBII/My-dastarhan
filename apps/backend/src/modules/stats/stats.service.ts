import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class StatsService {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async getStats(restaurantId: string, from?: string, to?: string) {
    const fromDate = from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const toDate = to || new Date().toISOString().split('T')[0];

    const overviewRaw = await this.dataSource.query(
      `SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) as confirmed,
        SUM(CASE WHEN status = 'arrived' THEN 1 ELSE 0 END) as arrived,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled,
        SUM(CASE WHEN status = 'no_show' THEN 1 ELSE 0 END) as no_show
      FROM bookings
      WHERE restaurant_id = $1 AND date >= $2 AND date <= $3`,
      [restaurantId, fromDate, toDate],
    );

    const o = overviewRaw[0];
    const total = parseInt(o.total) || 0;
    const confirmed = parseInt(o.confirmed) || 0;
    const arrived = parseInt(o.arrived) || 0;
    const cancelled = parseInt(o.cancelled) || 0;
    const noShow = parseInt(o.no_show) || 0;
    const confirmRate = total > 0 ? Math.round(((confirmed + arrived) / total) * 1000) / 10 : 0;

    const byDayRaw = await this.dataSource.query(
      `SELECT date::text, COUNT(*) as count
      FROM bookings
      WHERE restaurant_id = $1 AND date >= $2 AND date <= $3
      GROUP BY date
      ORDER BY date`,
      [restaurantId, fromDate, toDate],
    );
    const byDay = byDayRaw.map((r: { date: string; count: string }) => ({
      date: r.date,
      count: parseInt(r.count),
    }));

    const byHourRaw = await this.dataSource.query(
      `SELECT EXTRACT(HOUR FROM time_start::time)::int as hour, COUNT(*) as count
      FROM bookings
      WHERE restaurant_id = $1 AND date >= $2 AND date <= $3
      GROUP BY hour
      ORDER BY hour`,
      [restaurantId, fromDate, toDate],
    );
    const byHour = byHourRaw.map((r: { hour: number; count: string }) => ({
      hour: r.hour,
      count: parseInt(r.count),
    }));

    const topTablesRaw = await this.dataSource.query(
      `SELECT t.label, COUNT(*) as count
      FROM booking_tables bt
      JOIN bookings b ON b.id = bt.booking_id
      JOIN tables t ON t.id = bt.table_id
      WHERE b.restaurant_id = $1 AND b.date >= $2 AND b.date <= $3
      GROUP BY t.label
      ORDER BY count DESC
      LIMIT 10`,
      [restaurantId, fromDate, toDate],
    );
    const topTables = topTablesRaw.map((r: { label: string; count: string }) => ({
      label: r.label,
      count: parseInt(r.count),
    }));

    return {
      overview: { total, confirmed, arrived, cancelled, noShow, confirmRate },
      byDay,
      byHour,
      topTables,
      period: { from: fromDate, to: toDate },
    };
  }
}
