# Tutorial: thêm feature Product Management

Mục tiêu: trang `/products` hiển thị danh sách sản phẩm (có search), tạo mới và xóa sản phẩm. Ban đầu chạy với demo data, sau đó nối REST API.

Hãy mở `src/features/tasks/` bên cạnh để đối chiếu. Mọi bước dưới đây làm theo đúng mẫu đó.

```text
src/features/products/
├── schemas.ts                         # 1. Zod schema
├── types.ts                           # 2. Type + repository contract
├── services/
│   ├── demo-product-repository.ts     # 3a. Demo data
│   ├── rest-product-repository.ts     # 3b. REST adapter
│   └── product-repository.ts          # 3c. Chọn adapter theo API_MODE
├── actions.ts                         # 4. Server Actions
└── components/
    ├── product-table.tsx              # 5. UI (server)
    └── product-form-dialog.tsx        # 5. UI (client)
src/app/(app)/products/page.tsx        # 6. Route
src/config/navigation.tsx              # 7. Menu
```

Bắt đầu với file. Chỉ tách thành thư mục (`schemas/`, `hooks/`...) khi file đó trở nên quá lớn.

## Bước 1: Schema (`schemas.ts`)

Schema là nguồn sự thật của domain. Nó được dùng để validate response từ backend, validate form ở client và validate lại trong Server Action.

```ts
import { z } from 'zod'

export const PRODUCT_STATUSES = ['active', 'archived'] as const

export const productSchema = z.object({
  id: z.string(),
  name: z.string(),
  sku: z.string(),
  price: z.number().nonnegative(),
  stock: z.number().int().nonnegative(),
  status: z.enum(PRODUCT_STATUSES),
})

export const productPageSchema = z.object({
  items: z.array(productSchema),
  total: z.number().int(),
  page: z.number().int(),
  pageSize: z.number().int(),
})

export const productFormSchema = z.object({
  name: z.string().trim().min(2, { error: 'Name is too short' }).max(120),
  sku: z
    .string()
    .trim()
    .regex(/^[A-Z0-9-]{3,20}$/, { error: 'SKU: 3–20 chars, A–Z, 0–9, -' }),
  price: z.number({ error: 'Enter a price' }).nonnegative(),
  stock: z.number({ error: 'Enter stock' }).int().nonnegative(),
  status: z.enum(PRODUCT_STATUSES),
})

// Id sẽ được ghép vào URL của backend: dùng allowlist, chặn '.', '..', '/'.
export const productIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,100}$/)

export const productListQuerySchema = z.object({
  q: z.string().trim().max(100).optional().catch(undefined),
  page: z.coerce.number().int().min(1).catch(1),
})
```

## Bước 2: Types (`types.ts`)

```ts
import type { z } from 'zod'

import type { productFormSchema, productPageSchema, productSchema } from './schemas'

export type Product = z.infer<typeof productSchema>
export type ProductPage = z.infer<typeof productPageSchema>
export type ProductFormValues = z.infer<typeof productFormSchema>
export type ProductListQuery = { q?: string; page: number; pageSize: number }

export type ProductRepository = {
  list(query: ProductListQuery): Promise<ProductPage>
  create(input: ProductFormValues): Promise<Product>
  remove(id: string): Promise<void>
}
```

Type được suy ra (`z.infer`) từ schema, nên không bao giờ lệch khỏi phần validate.

## Bước 3: Services

### 3a. Demo (`services/demo-product-repository.ts`)

```ts
import 'server-only'

import { ApiError } from '@/lib/api/http-client'

import type { Product, ProductRepository } from '../types'

export function createDemoProductRepository(products: Product[]): ProductRepository {
  return {
    async list({ q, page, pageSize }) {
      const needle = q?.toLowerCase()
      const matches = products.filter(
        (p) =>
          !needle || p.name.toLowerCase().includes(needle) || p.sku.toLowerCase().includes(needle),
      )
      const start = (page - 1) * pageSize
      return {
        items: matches.slice(start, start + pageSize),
        total: matches.length,
        page,
        pageSize,
      }
    },
    async create(input) {
      const product = { id: crypto.randomUUID(), ...input }
      products.push(product)
      return product
    },
    async remove(id) {
      const index = products.findIndex((p) => p.id === id)
      if (index === -1) throw new ApiError('Product not found', { status: 404, code: 'NOT_FOUND' })
      products.splice(index, 1)
    },
  }
}

const store = globalThis as typeof globalThis & { __demoProducts?: Product[] }

export const demoProductRepository = createDemoProductRepository(
  (store.__demoProducts ??= [
    { id: 'p-1', name: 'Keyboard', sku: 'KB-001', price: 49, stock: 120, status: 'active' },
    { id: 'p-2', name: 'Mouse', sku: 'MS-002', price: 19, stock: 0, status: 'archived' },
  ]),
)
```

### 3b. REST (`services/rest-product-repository.ts`)

```ts
import 'server-only'

import { backendRequest } from '@/lib/api/backend'

import { productPageSchema, productSchema } from '../schemas'
import type { ProductRepository } from '../types'

export const restProductRepository: ProductRepository = {
  list: ({ q, page, pageSize }) =>
    backendRequest('/products', { query: { q, page, pageSize }, schema: productPageSchema }),
  create: (input) =>
    backendRequest('/products', { method: 'POST', body: input, schema: productSchema }),
  remove: async (id) => {
    await backendRequest(`/products/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },
}
```

### 3c. Selector (`services/product-repository.ts`)

```ts
import 'server-only'

import { serverEnv } from '@/lib/env'

import type { ProductRepository } from '../types'
import { demoProductRepository } from './demo-product-repository'
import { restProductRepository } from './rest-product-repository'

export const productRepository: ProductRepository =
  serverEnv.API_MODE === 'rest' ? restProductRepository : demoProductRepository
```

## Bước 4: Server Actions (`actions.ts`)

```ts
'use server'

import { revalidatePath } from 'next/cache'

import { toActionFailure, validationFailure, type ActionResult } from '@/lib/action-result'
import { requireSession } from '@/lib/auth'

import { productFormSchema, productIdSchema } from './schemas'
import { productRepository } from './services/product-repository'

export async function createProductAction(input: unknown): Promise<ActionResult> {
  try {
    await requireSession('products:write') // luôn là dòng đầu tiên
    const parsed = productFormSchema.safeParse(input)
    if (!parsed.success) return validationFailure(parsed.error)
    await productRepository.create(parsed.data)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidatePath('/products')
  return { ok: true }
}

export async function deleteProductAction(id: unknown): Promise<ActionResult> {
  try {
    await requireSession('products:write')
    const parsedId = productIdSchema.safeParse(id)
    if (!parsedId.success) return { ok: false, error: 'Invalid id' }
    await productRepository.remove(parsedId.data)
  } catch (error) {
    return toActionFailure(error)
  }
  revalidatePath('/products')
  return { ok: true }
}
```

Tham số có kiểu `unknown`, vì Server Action là endpoint public: không tin dữ liệu từ client. `requireSession()` chạy **trước** bước validate; ở demo mode luôn có session, còn ở REST mode nó kiểm tra người dùng thật (xem `docs/api-integration.md`, mục 8).

## Bước 5: Components

### `components/product-table.tsx` (Server Component, ghép từ `DataTable`)

```tsx
import { Badge } from '@/components/atoms/badge'
import { EmptyState } from '@/components/molecules/empty-state'
import { DataTable, type DataTableColumn } from '@/components/organisms/data-table'

import type { Product } from '../types'

const price = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' })

const columns: DataTableColumn<Product>[] = [
  { id: 'name', header: 'Name', cell: (p) => <span className="font-medium">{p.name}</span> },
  { id: 'sku', header: 'SKU', cell: (p) => p.sku },
  { id: 'price', header: 'Price', cell: (p) => price.format(p.price) },
  { id: 'stock', header: 'Stock', cell: (p) => p.stock },
  {
    id: 'status',
    header: 'Status',
    cell: (p) => <Badge variant={p.status === 'active' ? 'success' : 'neutral'}>{p.status}</Badge>,
  },
]

export function ProductTable({ products }: { products: Product[] }) {
  return (
    <DataTable
      caption="Products"
      columns={columns}
      rows={products}
      getRowKey={(p) => p.id}
      empty={<EmptyState title="No products" />}
    />
  )
}
```

### `components/product-form-dialog.tsx` (Client Component)

Copy cấu trúc từ `features/tasks/components/task-form.tsx` và `task-form-dialog.tsx`. Có hai điểm khác:

- Field dạng số dùng `register('price', { valueAsNumber: true })`.
- `onSubmit={createProductAction}`.

```tsx
<FormField label="Price" required error={errors.price?.message}>
  {(field) => (
    <Input
      type="number"
      step="0.01"
      min="0"
      {...field}
      {...register('price', { valueAsNumber: true })}
    />
  )}
</FormField>
```

Không cần tự viết Dialog, FormField hay Button: tất cả đã có sẵn trong design system.

## Bước 6: Route (`src/app/(app)/products/page.tsx`)

```tsx
import type { Metadata } from 'next'
import { Suspense } from 'react'

import { Skeleton } from '@/components/atoms/skeleton'
import { EmptyState } from '@/components/molecules/empty-state'
import { PageHeader } from '@/components/molecules/page-header'
import { ProductFormDialog } from '@/features/products/components/product-form-dialog'
import { ProductTable } from '@/features/products/components/product-table'
import { productListQuerySchema } from '@/features/products/schemas'
import { productRepository } from '@/features/products/services/product-repository'
import { getSession } from '@/lib/auth'

export const metadata: Metadata = { title: 'Products' }

export default function ProductsPage({ searchParams }: PageProps<'/products'>) {
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Products" actions={<ProductFormDialog />} />
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProductList searchParams={searchParams} />
      </Suspense>
    </div>
  )
}

async function ProductList({ searchParams }: Pick<PageProps<'/products'>, 'searchParams'>) {
  const raw = await searchParams // request-time data trước, để session không bị đánh giá lúc build
  if (!(await getSession())) return <EmptyState title="Sign-in required" />
  const query = productListQuerySchema.parse({ q: raw.q, page: raw.page })
  const result = await productRepository.list({ ...query, pageSize: 10 })
  return <ProductTable products={result.items} />
}
```

Những điều cần lưu ý:

- `PageProps<'/products'>` là type do Next.js tự sinh. Chạy `pnpm typecheck` (có `next typegen`) sau khi thêm route.
- Phần đọc `searchParams` hoặc gọi dữ liệu phải nằm **trong** `<Suspense>`, vì Cache Components đang bật.
- Nếu trang không đọc `searchParams`, `cookies()` hay `headers()`, hãy gọi `await connection()` trước khi đọc dữ liệu. Xem `app/(app)/dashboard/page.tsx`.

## Bước 7: Menu (`src/config/navigation.tsx`)

```tsx
import { Package } from 'lucide-react'
// …
{ href: '/products', label: 'Products', icon: <Package /> },
```

## Bước 8: Tests

| File                                                         | Test gì                                                                                                                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `features/products/schemas.test.ts`                          | SKU sai format bị từ chối; price âm bị từ chối                                                                                                                                              |
| `features/products/services/demo-product-repository.test.ts` | Search, create, remove, NOT_FOUND. Dùng `createDemoProductRepository([...])` để mỗi test có dữ liệu riêng.                                                                                  |
| `features/products/actions.test.ts`                          | `vi.mock('./services/product-repository')`, `vi.mock('next/cache')` và mock `requireSession` (xem `features/tasks/actions.test.ts`); chưa đăng nhập hoặc input sai thì không gọi repository |
| `features/products/components/product-form.test.tsx`         | Lỗi validation hiển thị; submit gọi `onSubmit` với số (không phải string)                                                                                                                   |
| `e2e/products.spec.ts`                                       | Tạo sản phẩm, thấy nó trong bảng, rồi xóa                                                                                                                                                   |

Xem các file mẫu tương ứng trong `features/tasks/`.

## Bước 9: Kiểm tra

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build
pnpm test:e2e
```

## Bước 10: Nối backend thật

Đặt `API_MODE=rest` và `API_BASE_URL`, sau đó chỉnh `rest-product-repository.ts` cho khớp với contract của backend. UI không thay đổi gì. Chi tiết: [api-integration.md](api-integration.md).
