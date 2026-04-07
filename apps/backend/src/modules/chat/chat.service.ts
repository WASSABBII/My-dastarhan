import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Restaurant } from '../restaurants/entities/restaurant.entity';
import { MenuCategory } from '../menu/entities/menu-category.entity';
import { MenuItem } from '../menu/entities/menu-item.entity';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Restaurant) private restaurantsRepo: Repository<Restaurant>,
    @InjectRepository(MenuCategory) private categoriesRepo: Repository<MenuCategory>,
    @InjectRepository(MenuItem) private itemsRepo: Repository<MenuItem>,
  ) {}

  async chat(
    slug: string,
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _history: Array<{ role: string; content: string }>,
  ): Promise<string> {
    const restaurant = await this.restaurantsRepo.findOne({ where: { slug } });
    if (!restaurant) return 'Ресторан не найден.';

    // TODO: Plug in Claude API when ANTHROPIC_API_KEY is set
    // if (process.env.ANTHROPIC_API_KEY) {
    //   const Anthropic = require('@anthropic-ai/sdk');
    //   const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    //   const systemPrompt = `Ты консьерж ресторана "${restaurant.name}". Адрес: ${restaurant.address}. Телефон: ${restaurant.phone}. Отвечай кратко и по делу на русском языке.`;
    //   const response = await client.messages.create({
    //     model: 'claude-haiku-4-5-20251001',
    //     max_tokens: 512,
    //     system: systemPrompt,
    //     messages: [..._history, { role: 'user', content: message }],
    //   });
    //   return response.content[0].type === 'text' ? response.content[0].text : '';
    // }

    // Mock mode: keyword matching
    const msg = message.toLowerCase();

    if (msg.includes('меню') || msg.includes('блюда') || msg.includes('еда') || msg.includes('кухня')) {
      const categories = await this.categoriesRepo.find({
        where: { restaurant_id: restaurant.id, is_active: true },
        order: { sort_order: 'ASC' },
      });
      if (!categories.length) return 'Меню пока не добавлено. Уточните у персонала.';
      const catList = categories.map((c) => c.name).join(', ');
      return `В нашем меню есть: ${catList}. Подробное меню с ценами доступно во вкладке "Меню" на нашей странице.`;
    }

    if (msg.includes('цена') || msg.includes('стоимость') || msg.includes('сколько') || msg.includes('прайс')) {
      const items = await this.itemsRepo.find({
        where: { restaurant_id: restaurant.id, is_available: true },
      });
      if (!items.length) return 'Информация о ценах уточняется. Позвоните нам для деталей.';
      const prices = items.map((i) => Number(i.price)).filter((p) => p > 0);
      if (!prices.length) return 'Информация о ценах уточняется.';
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      return `Цены в нашем меню от ${min.toLocaleString('ru')} до ${max.toLocaleString('ru')} ₸. Полное меню во вкладке "Меню".`;
    }

    if (
      msg.includes('время') ||
      msg.includes('часы') ||
      msg.includes('работает') ||
      msg.includes('открыт') ||
      msg.includes('режим')
    ) {
      if (restaurant.working_hours && Object.keys(restaurant.working_hours).length > 0) {
        const hours = Object.entries(restaurant.working_hours)
          .map(([day, time]) => `${day}: ${time}`)
          .join(', ');
        return `Часы работы ресторана: ${hours}.`;
      }
      return `Уточните часы работы по телефону${restaurant.phone ? ': ' + restaurant.phone : ' (указан на странице ресторана)'}.`;
    }

    if (
      msg.includes('бронь') ||
      msg.includes('забронировать') ||
      msg.includes('резерв') ||
      msg.includes('столик') ||
      msg.includes('стол')
    ) {
      return `Для бронирования нажмите кнопку "Забронировать" на нашей странице. Также можно позвонить${restaurant.phone ? ' по номеру ' + restaurant.phone : ''}.`;
    }

    if (msg.includes('адрес') || msg.includes('где находит') || msg.includes('как доехать') || msg.includes('где вы')) {
      return `Наш адрес: ${restaurant.address}.`;
    }

    if (msg.includes('телефон') || msg.includes('звонить') || msg.includes('контакт') || msg.includes('связаться')) {
      return `Наш телефон: ${restaurant.phone || 'указан на странице ресторана'}.`;
    }

    if (msg.includes('привет') || msg.includes('здравствуй') || msg.includes('добрый')) {
      return `Добро пожаловать в ${restaurant.name}! Чем могу помочь? Вы можете спросить про меню, цены, часы работы или бронирование столика.`;
    }

    return `Спасибо за вопрос! По любым вопросам вы можете позвонить нам${restaurant.phone ? ' по номеру ' + restaurant.phone : ''}. Также доступно бронирование столика прямо на нашей странице.`;
  }
}
