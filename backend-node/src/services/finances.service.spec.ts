import { Repository } from 'typeorm';
import { Account } from '../models/account.entity';
import { Category } from '../models/category.entity';
import { Transaction, TransactionType } from '../models/transaction.entity';
import { FinancesService } from './finances.service';

/**
 * Agregación de `/api/finances/summary`:
 *  - `total_balance` suma solo cuentas activas; `total_income` / `total_expenses`
 *    salen de un único SUM … FILTER por tipo.
 *  - `by_category` agrupa solo egresos (de mayor a menor) y calcula el
 *    porcentaje sobre `total_expenses`.
 *  - Aislamiento multi-tenant: todas las consultas filtran por `user_id`
 *    mediante parámetros (nunca interpolando valores en el SQL).
 */
const OWNER_ID = '3f1a2b4c-5d6e-7f80-9a1b-2c3d4e5f6071';

type QueryBuilderMock = Record<string, jest.Mock>;

const CHAIN_METHODS = [
  'select',
  'addSelect',
  'where',
  'andWhere',
  'setParameters',
  'innerJoin',
  'groupBy',
  'addGroupBy',
  'orderBy',
];

const buildQueryBuilder = (rawOne: unknown, rawMany: unknown[] = []): QueryBuilderMock => {
  const qb: QueryBuilderMock = {};
  for (const method of CHAIN_METHODS) qb[method] = jest.fn(() => qb);
  qb.getRawOne = jest.fn(() => Promise.resolve(rawOne));
  qb.getRawMany = jest.fn(() => Promise.resolve(rawMany));
  return qb;
};

let balanceQb: QueryBuilderMock;

let totalsQb: QueryBuilderMock;

let categoriesQb: QueryBuilderMock;

let service: FinancesService;

const setup = (options: { balance?: unknown; totals?: unknown; rows?: unknown[] } = {}) => {
  balanceQb = buildQueryBuilder(options.balance);
  totalsQb = buildQueryBuilder(options.totals);
  categoriesQb = buildQueryBuilder(undefined, options.rows ?? []);
  const accounts = { createQueryBuilder: jest.fn(() => balanceQb) };
  const transactions = {
    createQueryBuilder: jest.fn().mockReturnValueOnce(totalsQb).mockReturnValueOnce(categoriesQb),
  };
  service = new FinancesService(
    accounts as unknown as Repository<Account>,
    transactions as unknown as Repository<Transaction>,
  );
};

/** Todos los fragmentos SQL pasados a la cadena del QueryBuilder. */
const sqlFragments = (qb: QueryBuilderMock): string[] =>
  CHAIN_METHODS.flatMap((method) =>
    qb[method].mock.calls.flatMap((args: unknown[]) => args.filter((a) => typeof a === 'string')),
  ) as string[];

const SUPERMERCADO = { category_id: 'c1', category_name: 'Supermercado', icon: 'shopping-cart', color: '#FF5733' };
const OCIO = { category_id: 'c2', category_name: 'Ocio', icon: 'gift', color: '#00FF00' };

it('agrega saldos, ingresos, egresos y el desglose por sobre', async () => {
  setup({
    balance: { total_balance: '18609.75' },
    totals: { total_income: '3500', total_expenses: '300' },
    rows: [
      { ...SUPERMERCADO, total_amount: '200' },
      { ...OCIO, total_amount: '100' },
    ],
  });

  await expect(service.getSummary(OWNER_ID)).resolves.toEqual({
    total_balance: 18609.75,
    total_income: 3500,
    total_expenses: 300,
    by_category: [
      { ...SUPERMERCADO, total_amount: 200, percentage: 66.67 },
      { ...OCIO, total_amount: 100, percentage: 33.33 },
    ],
  });
});

it('usuario sin datos: todo en 0 y sin desglose', async () => {
  setup({ balance: undefined, totals: { total_income: null, total_expenses: null }, rows: [] });

  await expect(service.getSummary(OWNER_ID)).resolves.toEqual({
    total_balance: 0,
    total_income: 0,
    total_expenses: 0,
    by_category: [],
  });
});

it('sin egresos el porcentaje es 0 (no divide por cero)', async () => {
  setup({
    balance: { total_balance: '10' },
    totals: { total_income: '10', total_expenses: '0' },
    rows: [{ category_id: 'c1', category_name: 'Z', icon: 'tag', color: '#000000', total_amount: '0' }],
  });

  const summary = await service.getSummary(OWNER_ID);
  expect(summary.by_category[0].percentage).toBe(0);
});

it('icon/color NULL en la base se devuelven como string vacío (contrato no-nulo)', async () => {
  setup({
    totals: { total_income: '0', total_expenses: '50' },
    rows: [{ category_id: 'c1', category_name: 'Sin estilo', icon: null, color: null, total_amount: '50' }],
  });

  const [category] = (await service.getSummary(OWNER_ID)).by_category;
  expect(category).toMatchObject({ icon: '', color: '', percentage: 100 });
});

it('total_balance suma solo las cuentas activas del usuario', async () => {
  setup();
  await service.getSummary(OWNER_ID);

  expect(balanceQb.select).toHaveBeenCalledWith('COALESCE(SUM(a.balance), 0)', 'total_balance');
  expect(balanceQb.where).toHaveBeenCalledWith('a.user_id = :userId', { userId: OWNER_ID });
  expect(balanceQb.andWhere).toHaveBeenCalledWith('a.is_active = true');
});

it('ingresos y egresos salen de SUM … FILTER con el tipo parametrizado', async () => {
  setup();
  await service.getSummary(OWNER_ID);

  expect(totalsQb.where).toHaveBeenCalledWith('t.user_id = :userId', { userId: OWNER_ID });
  expect(totalsQb.setParameters).toHaveBeenCalledWith({
    income: TransactionType.INCOME,
    expense: TransactionType.EXPENSE,
  });
});

it('by_category: solo egresos, sobres del mismo usuario y orden descendente', async () => {
  setup();
  await service.getSummary(OWNER_ID);

  expect(categoriesQb.innerJoin).toHaveBeenCalledWith(Category, 'c', 'c.id = t.category_id AND c.user_id = t.user_id');
  expect(categoriesQb.where).toHaveBeenCalledWith('t.user_id = :userId', { userId: OWNER_ID });
  expect(categoriesQb.andWhere).toHaveBeenCalledWith('t.type = :expense', {
    expense: TransactionType.EXPENSE,
  });
  expect(categoriesQb.orderBy).toHaveBeenCalledWith('total_amount', 'DESC');
});

it('nunca interpola el user_id en el SQL (consultas parametrizadas)', async () => {
  setup();
  await service.getSummary(OWNER_ID);

  for (const qb of [balanceQb, totalsQb, categoriesQb]) {
    const fragments = sqlFragments(qb);
    expect(fragments.length).toBeGreaterThan(0);
    for (const fragment of fragments) expect(fragment).not.toContain(OWNER_ID);
  }
});
