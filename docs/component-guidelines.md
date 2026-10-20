# Hướng dẫn về Component

## 1. Trước khi tạo component mới

Đi lần lượt từ trên xuống. Dừng ở bước đầu tiên giải quyết được vấn đề:

1. **Đã có sẵn chưa?** Xem `src/components/**` và Storybook (`pnpm storybook`).
2. **Ghép từ component có sẵn được không?** Ví dụ `<EmptyState action={<Button>…</Button>} />`.
3. **Thêm một prop hoặc variant cho component có sẵn được không?** Chỉ làm vậy khi nó vẫn đúng một trách nhiệm.
4. **HTML native làm được không?** `<select>`, `<input type="date">`, `<dialog>`, `<details>`. Bạn được miễn phí accessibility và hỗ trợ mobile.
5. Chỉ khi các bước trên không được mới tạo component mới.

**Nên tạo component khi:**

- Cùng một đoạn UI lặp lại ≥ 2 lần với cùng ý nghĩa; hoặc
- Một khối UI có trách nhiệm rõ ràng và làm file chứa nó dễ đọc hơn (ví dụ `TaskStatusSelect`).

**Không nên tạo component khi:**

- Nó chỉ bọc một thẻ HTML kèm vài class cố định (`<Title>` = `<h2 className="…">`). Hãy dùng class trực tiếp.
- Bạn đang đoán "sau này có thể cần". Chờ đến khi thật sự cần.

## 2. Phân loại: shared hay feature?

```text
Component có chứa kiến thức nghiệp vụ không?
(tên domain như Task/Order/User, gọi Server Action, schema nghiệp vụ, label nghiệp vụ)
│
├── CÓ  → src/features/<feature>/components/
│
└── KHÔNG → Có dùng được ở một dự án khác domain không?
            ├── CÓ  → src/components/<atoms|molecules|organisms|templates>/
            └── CHƯA chắc → để trong feature trước; chuyển lên shared khi dùng lần thứ 2
```

Ví dụ:

| Component            | Ở đâu          | Vì sao                                     |
| -------------------- | -------------- | ------------------------------------------ |
| `Badge`              | atoms          | Không biết gì về task                      |
| `TaskStatusBadge`    | features/tasks | Biết map `done` → `success` và nhãn "Done" |
| `DataTable`          | organisms      | Bảng generic; ô do người gọi quyết định    |
| `TaskTable`          | features/tasks | Biết các cột của Task và gọi action        |
| `ConfirmationDialog` | molecules      | Xác nhận bất kỳ hành động nào              |
| `DeleteTaskButton`   | features/tasks | Gọi `deleteTaskAction`                     |

`TaskCard` có chứa nhiều atom **không** có nghĩa nó là molecule dùng chung. Câu hỏi quyết định là **có kiến thức domain hay không**, không phải "ghép từ bao nhiêu atom".

## 3. Chọn cấp Atomic

| Nếu component…                                                                      | Cấp                          |
| ----------------------------------------------------------------------------------- | ---------------------------- |
| Là một phần tử UI đơn, gần với một thẻ HTML, không chia nhỏ hơn được                | **Atom**                     |
| Ghép vài atom để làm **một** việc (label + input + error; input + icon + nút clear) | **Molecule**                 |
| Là một **khu vực** riêng của trang (header, sidebar, bảng, form lớn)                | **Organism**                 |
| Là **khung bố cục** cả trang, có slot, không có nội dung thật                       | **Template**                 |
| Là template + dữ liệu thật                                                          | **Page** = `app/**/page.tsx` |

Khi phân vân giữa hai cấp, hãy chọn cấp thấp hơn. Chuyển lên sau rất dễ: chỉ cần di chuyển file và sửa import.

## 4. Composition

Ưu tiên ghép component lại với nhau, thay vì một component với hàng chục prop boolean.

```tsx
// Tốt: slot nhận ReactNode
<PageHeader title="Tasks" actions={<TaskFormDialog />} />
<EmptyState title="No tasks" action={<Button>Create</Button>} />

// Tốt: render prop khi component con cần nhận props từ cha
<FormField label="Title" error={errors.title?.message}>
  {(field) => <Input {...field} {...register('title')} />}
</FormField>

// Tốt: dựng component từ component nhỏ hơn
// ConfirmationDialog = Dialog + Alert + 2 Button

// Tránh: một component làm mọi thứ
<Modal isConfirm isForm isDelete showFooter footerAlign="right" … />
```

Mẫu chuẩn khi viết một shared component (xem `src/components/atoms/button.tsx`):

```tsx
import { cva, type VariantProps } from 'class-variance-authority'
import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const thingVariants = cva('base classes', {
  variants: { variant: { primary: '…', outline: '…' }, size: { sm: '…', md: '…' } },
  defaultVariants: { variant: 'primary', size: 'md' },
})

export type ThingProps = ComponentProps<'div'> & VariantProps<typeof thingVariants>

export function Thing({ className, variant, size, ...props }: ThingProps) {
  return <div className={cn(thingVariants({ variant, size }), className)} {...props} />
}
```

Checklist:

- [ ] Props có type đầy đủ, không có `any`; mở rộng `ComponentProps<'tag'>` khi component bọc một thẻ HTML.
- [ ] Nhận `className` và merge bằng `cn()`, để class của người gọi được ưu tiên.
- [ ] Chỉ dùng token màu (`bg-primary`, `text-muted-foreground`), không dùng hex.
- [ ] Accessibility: có label/`aria-label`; icon trang trí có `aria-hidden`; `aria-invalid` khi có lỗi; điều khiển được bằng bàn phím.
- [ ] Xử lý các trạng thái disabled, loading và error khi phù hợp.
- [ ] Không thêm `'use client'` nếu không dùng state, effect hay event handler.
- [ ] Có test cho hành vi quan trọng (`*.test.tsx`) và story (`*.stories.tsx`) nếu là component hiển thị.
- [ ] Đặt tên file kebab-case (`search-input.tsx`), tên export PascalCase (`SearchInput`), dùng named export.

## 5. Khi nào chuyển component từ feature lên shared

Chỉ chuyển khi **cả ba** điều sau đúng:

1. Component được dùng (hoặc cần dùng) ở ≥ 2 feature.
2. Có thể bỏ hết kiến thức domain: tên prop trung tính (`items`, `label`, `onConfirm` thay vì `tasks`, `onDeleteTask`).
3. Phần domain còn lại có thể truyền vào qua props hoặc slot.

Các bước:

1. Tách phần generic sang `components/<cấp>/`, đổi tên cho trung tính.
2. Giữ một wrapper mỏng trong feature nếu cần. Ví dụ `TaskStatusBadge` dùng `Badge`.
3. Thêm test và story cho component shared.
4. Chạy `pnpm lint` để chắc chắn shared không import ngược lại feature.

## 6. Anti-pattern thường gặp

| Anti-pattern                                                         | Vấn đề                                                       | Cách làm đúng                                                                                             |
| -------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Đưa `TaskCard` vào `molecules/` vì "nó ghép từ atoms"                | Design system bị lẫn nghiệp vụ                               | Để trong `features/tasks/components/`                                                                     |
| Atom gọi API hoặc Server Action                                      | Không dùng lại được, khó test                                | Feature gọi; atom chỉ nhận props                                                                          |
| Mỗi cấp bọc thêm một lớp (`TaskButton` → `PrimaryButton` → `Button`) | Thêm tầng mà không thêm giá trị                              | Dùng `Button variant="primary"`                                                                           |
| God component 500 dòng                                               | Khó đọc, khó test                                            | Tách theo trách nhiệm: filters, table, form                                                               |
| `'use client'` ở page hoặc layout                                    | Cả cây bị đẩy xuống client, mất lợi ích của Server Component | Chỉ đặt ở lá (leaf) tương tác                                                                             |
| Truyền prop qua 4–5 tầng (prop drilling)                             | Dễ vỡ khi refactor                                           | Composition (slot), URL state, hoặc để Server Component con tự lấy dữ liệu                                |
| Thêm Redux/Zustand "cho chắc"                                        | Phức tạp không cần thiết                                     | URL state + Server Components; thêm global state khi có nhu cầu thật                                      |
| Viết lại Modal, Select hay Date picker từ đầu                        | Sai về accessibility (focus, phím)                           | Dùng native element (`<dialog>`, `<select>`, `<input type="date">`) hoặc headless library đã trưởng thành |
| Hard-code màu `#3b82f6`                                              | Không đổi theme được                                         | Dùng token                                                                                                |
| Barrel `index.ts` ở mọi thư mục                                      | Kéo code server vào bundle client, dễ tạo vòng import        | Import trực tiếp từ file                                                                                  |

## 7. Storybook

- Story nằm cạnh component: `button.stories.tsx`.
- `title` theo cấp: `'Atoms/Button'`, `'Molecules/FormField'`, `'Templates/DashboardTemplate'`.
- Thanh toolbar có nút đổi **Theme** (light/dark). Addon **a11y** báo lỗi accessibility ngay trong story.
- Chỉ viết story cho component shared. UI của feature được kiểm tra bằng test và E2E.
