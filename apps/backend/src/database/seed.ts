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

  // Проверяем есть ли уже тестовый owner
  const existingUser = await qr.query(
    `SELECT id FROM users WHERE email = 'owner@test.com' LIMIT 1`,
  );

  let ownerId: string;
  if (existingUser.length === 0) {
    const hash = await bcrypt.hash('password123', 10);
    const userResult = await qr.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'owner') RETURNING id`,
      ['owner@test.com', hash],
    );
    ownerId = userResult[0].id;
    console.log('✅ Создан owner: owner@test.com / password123');
  } else {
    ownerId = existingUser[0].id;
    console.log('ℹ️  Owner уже существует');
  }

  // Рестораны с данными
  const restaurants = [
    {
      name: 'Думан',
      slug: 'duman',
      description:
        'Уютный ресторан казахской кухни с живой музыкой и панорамным видом на город. Традиционные блюда приготовленные по старинным рецептам.',
      address: 'ул. Достык, 97, Алматы',
      district: 'Бостандыкский',
      cuisine_type: 'Казахская',
      phone: '+7 727 123 45 67',
      buffer_minutes: 15,
      deposit_required: false,
    },
    {
      name: 'Sakura Garden',
      slug: 'sakura-garden',
      description:
        'Аутентичная японская кухня в сердце Алматы. Суши, сашими и горячие блюда от шеф-повара из Токио. Лаконичный интерьер в японском стиле.',
      address: 'пр. Аль-Фараби, 17, Алматы',
      district: 'Медеуский',
      cuisine_type: 'Японская',
      phone: '+7 727 234 56 78',
      buffer_minutes: 15,
      deposit_required: false,
    },
    {
      name: 'La Terrasse',
      slug: 'la-terrasse',
      description:
        'Европейская кухня с французским акцентом. Открытая терраса с видом на горы, изысканные блюда и обширная карта вин.',
      address: 'ул. Горная, 38, Алматы',
      district: 'Медеуский',
      cuisine_type: 'Европейская',
      phone: '+7 727 345 67 89',
      buffer_minutes: 20,
      deposit_required: true,
      deposit_amount: 5000,
    },
    {
      name: 'Чайхана Нур',
      slug: 'chaikhana-nur',
      description:
        'Восточная чайхана с богатым меню узбекской и казахской кухни. Большие порции, домашняя атмосфера. Лучший плов в городе.',
      address: 'ул. Жибек Жолы, 56, Алматы',
      district: 'Алмалинский',
      cuisine_type: 'Казахская',
      phone: '+7 727 456 78 90',
      buffer_minutes: 10,
      deposit_required: false,
    },
    {
      name: 'Bella Italia',
      slug: 'bella-italia',
      description:
        'Настоящая итальянская пицца и паста в дровяной печи. Семейный ресторан с теплой атмосферой и свежими импортными ингредиентами.',
      address: 'мкр Самал-2, 111, Алматы',
      district: 'Бостандыкский',
      cuisine_type: 'Итальянская',
      phone: '+7 727 567 89 01',
      buffer_minutes: 15,
      deposit_required: false,
    },
    {
      name: 'Грузинский Дворик',
      slug: 'gruzinskiy-dvorik',
      description:
        'Хинкали, хачапури и шашлык в уютной обстановке грузинского двора. Живая музыка по пятницам и субботам.',
      address: 'ул. Байтурсынова, 89, Алматы',
      district: 'Алмалинский',
      cuisine_type: 'Грузинская',
      phone: '+7 727 678 90 12',
      buffer_minutes: 15,
      deposit_required: false,
    },
  ];

  for (const rest of restaurants) {
    const existing = await qr.query(
      `SELECT id FROM restaurants WHERE slug = $1 LIMIT 1`,
      [rest.slug],
    );

    let restaurantId: string;
    if (existing.length === 0) {
      const result = await qr.query(
        `INSERT INTO restaurants
          (name, slug, description, address, district, cuisine_type, phone,
           buffer_minutes, deposit_required, deposit_amount, status, working_hours)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'active',$11)
         RETURNING id`,
        [
          rest.name,
          rest.slug,
          rest.description,
          rest.address,
          rest.district,
          rest.cuisine_type,
          rest.phone,
          rest.buffer_minutes,
          rest.deposit_required,
          rest.deposit_required ? (rest as any).deposit_amount : null,
          JSON.stringify({
            mon: '10:00-23:00',
            tue: '10:00-23:00',
            wed: '10:00-23:00',
            thu: '10:00-23:00',
            fri: '10:00-00:00',
            sat: '11:00-00:00',
            sun: '11:00-23:00',
          }),
        ],
      );
      restaurantId = result[0].id;

      // Связь owner → restaurant
      await qr.query(
        `INSERT INTO restaurant_users (user_id, restaurant_id, role) VALUES ($1, $2, 'owner')
         ON CONFLICT (user_id, restaurant_id) DO NOTHING`,
        [ownerId, restaurantId],
      );

      // Subscription trial
      await qr.query(
        `INSERT INTO subscriptions (restaurant_id, plan, status, trial_ends_at)
         VALUES ($1, 'business', 'trial', NOW() + INTERVAL '14 days')
         ON CONFLICT (restaurant_id) DO NOTHING`,
        [restaurantId],
      );

      // Столики (8 штук)
      const tableShapes = ['round', 'round', 'square', 'square', 'rectangle', 'round', 'square', 'rectangle'];
      const tablePositions = [
        { x: 5, y: 5 }, { x: 15, y: 5 }, { x: 25, y: 5 }, { x: 35, y: 5 },
        { x: 5, y: 20 }, { x: 15, y: 20 }, { x: 25, y: 20 }, { x: 35, y: 20 },
      ];
      const tableCaps = [2, 2, 4, 4, 6, 2, 4, 8];

      for (let i = 0; i < 8; i++) {
        await qr.query(
          `INSERT INTO tables (restaurant_id, label, capacity, shape, pos_x, pos_y, location_tag, is_active)
           VALUES ($1, $2, $3, $4, $5, $6, $7, true)`,
          [
            restaurantId,
            `Стол ${i + 1}`,
            tableCaps[i],
            tableShapes[i],
            tablePositions[i].x,
            tablePositions[i].y,
            i < 4 ? 'Зал' : 'Терраса',
          ],
        );
      }

      // Меню — 2 категории + блюда
      const catResult = await qr.query(
        `INSERT INTO menu_categories (restaurant_id, name, sort_order, is_active)
         VALUES ($1, 'Основные блюда', 1, true), ($1, 'Напитки', 2, true)
         RETURNING id`,
        [restaurantId],
      );

      const mainCatId = catResult[0].id;
      const drinksCatId = catResult[1].id;

      const mainDishes = [
        { name: 'Бешбармак', desc: 'Традиционное казахское блюдо с мясом и лапшой', price: 3500 },
        { name: 'Манты', desc: 'Паровые пельмени с мясом и луком', price: 2200 },
        { name: 'Шашлык из баранины', desc: 'Нежный шашлык на углях', price: 4000 },
      ];

      for (const dish of mainDishes) {
        await qr.query(
          `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_available)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [mainCatId, restaurantId, dish.name, dish.desc, dish.price],
        );
      }

      const drinks = [
        { name: 'Кумыс', desc: 'Традиционный напиток из кобыльего молока', price: 800 },
        { name: 'Зелёный чай', desc: 'Ароматный чай с молоком', price: 500 },
      ];

      for (const drink of drinks) {
        await qr.query(
          `INSERT INTO menu_items (category_id, restaurant_id, name, description, price, is_available)
           VALUES ($1, $2, $3, $4, $5, true)`,
          [drinksCatId, restaurantId, drink.name, drink.desc, drink.price],
        );
      }

      console.log(`✅ Создан ресторан: ${rest.name} (${rest.slug})`);
    } else {
      // Просто активируем если pending
      await qr.query(
        `UPDATE restaurants SET status = 'active' WHERE slug = $1`,
        [rest.slug],
      );
      console.log(`ℹ️  Ресторан ${rest.name} уже существует — активирован`);
    }
  }

  // Активируем все pending рестораны (если были созданы через регистрацию)
  const activated = await qr.query(
    `UPDATE restaurants SET status = 'active' WHERE status = 'pending' RETURNING name, slug`,
  );
  if (activated.length > 0) {
    console.log(`✅ Активированы pending рестораны: ${activated.map((r: any) => r.name).join(', ')}`);
  }

  await qr.release();
  await AppDataSource.destroy();
  console.log('\n🎉 Сид завершён! Каталог теперь показывает рестораны.');
  console.log('   Вход для владельца: owner@test.com / password123');
}

seed().catch((err) => {
  console.error('❌ Ошибка сида:', err.message);
  process.exit(1);
});
