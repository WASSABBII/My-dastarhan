import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: '1234',
  database: 'dastarkhan',
  synchronize: false,
  logging: false,
  entities: [],
});

async function seed() {
  await AppDataSource.initialize();
  const qr = AppDataSource.createQueryRunner();
  await qr.connect();

  console.log('🌱 Начинаем сидирование...');

  // 1. Owner
  let ownerId: string;
  const existingUser = await qr.query(
    `SELECT id FROM users WHERE email = 'owner@test.com' LIMIT 1`,
  );
  if (existingUser.length === 0) {
    const hash = await bcrypt.hash('password123', 10);
    const result = await qr.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'owner') RETURNING id`,
      ['owner@test.com', hash],
    );
    ownerId = result[0].id;
    console.log('✅ Создан owner: owner@test.com / password123');
  } else {
    ownerId = existingUser[0].id;
    console.log('ℹ️  Owner уже существует:', ownerId);
  }

  // 2. Ресторан
  let restaurantId: string;
  const existingRest = await qr.query(
    `SELECT id FROM restaurants WHERE slug = 'duman' LIMIT 1`,
  );
  if (existingRest.length === 0) {
    const result = await qr.query(
      `INSERT INTO restaurants
        (name, slug, description, address, district, cuisine_type, phone,
         buffer_minutes, deposit_required, status, working_hours)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'active',$10)
       RETURNING id`,
      [
        'Думан',
        'duman',
        'Уютный ресторан казахской кухни с живой музыкой и панорамным видом на город.',
        'ул. Достык, 97, Алматы',
        'Бостандыкский',
        'Казахская',
        '+7 727 123 45 67',
        15,
        false,
        JSON.stringify({
          mon: '10:00-23:00', tue: '10:00-23:00', wed: '10:00-23:00',
          thu: '10:00-23:00', fri: '10:00-00:00',
          sat: '11:00-00:00', sun: '11:00-23:00',
        }),
      ],
    );
    restaurantId = result[0].id;
    console.log('✅ Создан ресторан: Думан (duman)');
  } else {
    restaurantId = existingRest[0].id;
    await qr.query(`UPDATE restaurants SET status = 'active' WHERE id = $1`, [restaurantId]);
    console.log('ℹ️  Ресторан уже существует — активирован');
  }

  // 3. Привязка owner → restaurant (всегда, даже если уже есть)
  await qr.query(
    `INSERT INTO restaurant_users (user_id, restaurant_id, role)
     VALUES ($1, $2, 'owner')
     ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
    [ownerId, restaurantId],
  );
  console.log('✅ Owner привязан к ресторану');

  // 4. Подписка
  await qr.query(
    `INSERT INTO subscriptions (restaurant_id, plan, status, trial_ends_at)
     VALUES ($1, 'business', 'trial', NOW() + INTERVAL '14 days')
     ON CONFLICT (restaurant_id) DO NOTHING`,
    [restaurantId],
  );

  // 5. Столики (только если нет)
  const tablesCount = await qr.query(
    `SELECT COUNT(*) as cnt FROM tables WHERE restaurant_id = $1`,
    [restaurantId],
  );
  if (parseInt(tablesCount[0].cnt) === 0) {
    const tables = [
      { label: 'Стол 1', capacity: 2, shape: 'round',     pos_x: 100, pos_y: 100, tag: 'Зал' },
      { label: 'Стол 2', capacity: 2, shape: 'round',     pos_x: 220, pos_y: 100, tag: 'Зал' },
      { label: 'Стол 3', capacity: 4, shape: 'square',    pos_x: 340, pos_y: 100, tag: 'Зал' },
      { label: 'Стол 4', capacity: 4, shape: 'square',    pos_x: 460, pos_y: 100, tag: 'Зал' },
      { label: 'Стол 5', capacity: 6, shape: 'rectangle', pos_x: 100, pos_y: 280, tag: 'Зал' },
      { label: 'Стол 6', capacity: 2, shape: 'round',     pos_x: 280, pos_y: 280, tag: 'Терраса' },
      { label: 'Стол 7', capacity: 4, shape: 'square',    pos_x: 400, pos_y: 280, tag: 'Терраса' },
      { label: 'Стол 8', capacity: 8, shape: 'rectangle', pos_x: 560, pos_y: 280, tag: 'Терраса' },
    ];
    for (const t of tables) {
      await qr.query(
        `INSERT INTO tables (restaurant_id, label, capacity, shape, pos_x, pos_y, location_tag, is_active)
         VALUES ($1,$2,$3,$4,$5,$6,$7,true)`,
        [restaurantId, t.label, t.capacity, t.shape, t.pos_x, t.pos_y, t.tag],
      );
    }
    console.log('✅ Создано 8 столиков');
  }

  // 6. Меню (только если нет)
  const catsCount = await qr.query(
    `SELECT COUNT(*) as cnt FROM menu_categories WHERE restaurant_id = $1`,
    [restaurantId],
  );
  if (parseInt(catsCount[0].cnt) === 0) {
    const cats = await qr.query(
      `INSERT INTO menu_categories (restaurant_id, name, sort_order, is_active)
       VALUES ($1,'Основные блюда',1,true),($1,'Напитки',2,true) RETURNING id`,
      [restaurantId],
    );
    const mainId = cats[0].id;
    const drinksId = cats[1].id;

    for (const [catId, items] of [
      [mainId, [
        ['Бешбармак', 'Традиционное казахское блюдо с мясом и лапшой', 3500],
        ['Манты', 'Паровые пельмени с мясом и луком', 2200],
        ['Шашлык из баранины', 'Нежный шашлык на углях', 4000],
      ]],
      [drinksId, [
        ['Кумыс', 'Традиционный напиток из кобыльего молока', 800],
        ['Зелёный чай', 'Ароматный чай с молоком', 500],
      ]],
    ] as [string, [string, string, number][]][]) {
      for (const [name, desc, price] of items) {
        await qr.query(
          `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_available)
           VALUES ($1,$2,$3,$4,$5,true)`,
          [catId, restaurantId, name, desc, price],
        );
      }
    }
    console.log('✅ Создано меню (5 позиций)');
  }

  await qr.release();
  await AppDataSource.destroy();

  console.log('\n🎉 Сид завершён!');
  console.log('   Логин владельца: owner@test.com / password123');
  console.log('   Ресторан: Думан → /duman');
}

seed().catch((err) => {
  console.error('❌ Ошибка сида:', err.message);
  process.exit(1);
});
