# Atomic Design Next.js Template

Starter template cho các dự án Next.js production: admin dashboard, ứng dụng nội bộ, SaaS, hệ thống quản lý dùng REST API.

Kiến trúc: **Hybrid Atomic Design + Feature-Based**.

- **Atomic Design** tổ chức các UI component dùng chung (design system).
- **Feature module** tổ chức các chức năng nghiệp vụ.

Template có sẵn demo **Task Management** chạy được ngay mà không cần backend.

> Viết cho backend developer mới làm frontend. Đọc theo thứ tự: README → [docs/architecture.md](docs/architecture.md) → [docs/component-guidelines.md](docs/component-guidelines.md) → [docs/create-new-feature.md](docs/create-new-feature.md) → [docs/api-integration.md](docs/api-integration.md).

---

## Tech stack

| Nhóm      | Thư viện                                                                                             | Lý do                                              |
| --------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript strict                               | Server Components, Server Actions, streaming       |
| Styling   | Tailwind CSS 4, CSS variables (design tokens), `class-variance-authority`, `clsx` + `tailwind-merge` | Token tập trung, variant có type                   |
| Icons     | `lucide-react`                                                                                       | Nhẹ, tree-shakable                                 |
| Form      | React Hook Form, Zod 4, `@hookform/resolvers`                                                        | Một schema dùng cho cả client và server validation |
| Data      | Native `fetch` + typed client (`src/lib/api`)                                                        | Không cần thư viện, chạy được ở server và client   |
| Test      | Vitest, React Testing Library, Playwright                                                            | Unit/component + E2E                               |
| Quality   | ESLint (next + boundaries), Prettier, Husky + lint-staged, GitHub Actions                            |                                                    |
| Docs UI   | Storybook 10 (`@storybook/nextjs-vite`, addon a11y)                                                  | Phát triển và xem component độc lập                |

**Cố ý không dùng:**

- **Thư viện UI đầy đủ** (MUI, Ant Design...). Component tự viết, nằm trong repo.
- **Headless library cho Dialog.** Dùng `<dialog>` native: trình duyệt tự lo focus trap, nút Esc và trả focus.
- **TanStack Query.** Demo dùng Server Components + Server Actions là đủ. Khi nào nên thêm: xem [docs/api-integration.md](docs/api-integration.md) (mục "Client-side fetching").
- **Global state** (Redux/Zustand). Chưa có nhu cầu thật; state của filter nằm trên URL.
- **ESLint 10 / TypeScript 6+.** Plugin của `eslint-config-next` 16.4 chưa hỗ trợ (peer dependency). Template đang giữ ESLint 9 và TypeScript 5.9.

## Yêu cầu

- Node.js `^22.22.2`, `^24.15.0` hoặc `>=26` (giới hạn bởi Vitest, jsdom và lint-staged). Bản dùng chung cho local và CI nằm trong `.nvmrc` (24); chạy `nvm use` hoặc `fnm use` để chọn đúng version.
- pnpm (version được khóa trong `packageManager` của `package.json`). Cài đặt qua Corepack:

```bash
corepack enable   # một lần trên máy. Sau đó lệnh `pnpm` dùng đúng version của project
```

## Cài đặt và chạy

```bash
pnpm install
cp .env.example .env.local     # tùy chọn: mặc định đã chạy demo mode
pnpm dev                       # http://localhost:3000
```

### Environment

| Biến                   | Phạm vi | Mặc định       | Ý nghĩa                                                                                  |
| ---------------------- | ------- | -------------- | ---------------------------------------------------------------------------------------- |
| `API_MODE`             | server  | `demo`         | `demo` = dữ liệu in-memory, `rest` = gọi backend thật                                    |
| `API_BASE_URL`         | server  | (không có)     | Bắt buộc khi `API_MODE=rest`                                                             |
| `API_TOKEN`            | server  | (không có)     | Service token, gửi dạng `Authorization: Bearer` (chỉ từ server)                          |
| `API_TIMEOUT_MS`       | server  | `10000`        | Timeout cho mỗi request                                                                  |
| `AUTH_ALLOW_ANONYMOUS` | server  | `false`        | **Nguy hiểm.** `true` = bỏ qua đăng nhập ở `API_MODE=rest`; chỉ dùng sau VPN/SSO gateway |
| `NEXT_PUBLIC_APP_NAME` | public  | `Atomic Admin` | Tên app, được inline vào bundle trình duyệt                                              |

- Env được validate bằng Zod trong `src/lib/env.ts`. `src/instrumentation.ts` chạy bước kiểm tra này khi server khởi động: cấu hình sai thì process thoát với exit code 1, kèm thông báo rõ ràng.
- Biến có prefix `NEXT_PUBLIC_` sẽ lộ ra trình duyệt. **Không bao giờ** đặt secret vào đó.

## Scripts

| Lệnh                                                   | Việc                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------- |
| `pnpm dev`                                             | Dev server (Turbopack)                                        |
| `pnpm build` / `pnpm start`                            | Build production / chạy bản build                             |
| `pnpm typecheck`                                       | Sinh route types + `tsc --noEmit`                             |
| `pnpm lint` / `pnpm lint:fix`                          | ESLint (bao gồm luật phụ thuộc giữa các layer)                |
| `pnpm format` / `pnpm format:check`                    | Prettier (tự sắp xếp class Tailwind)                          |
| `pnpm test` / `pnpm test:watch` / `pnpm test:coverage` | Vitest                                                        |
| `pnpm test:e2e`                                        | Playwright (lần đầu: `pnpm exec playwright install chromium`) |
| `pnpm storybook` / `pnpm build-storybook`              | Storybook tại http://localhost:6006                           |
| `pnpm check`                                           | typecheck + lint + format:check + test                        |

Pre-commit hook (Husky + lint-staged) tự chạy ESLint và Prettier trên các file đã stage.

## Cấu trúc thư mục

```text
src/
├── app/                      # ROUTING ONLY: route, layout, loading/error, metadata
│   ├── layout.tsx            # Root layout: font, theme script, globals.css
│   ├── not-found.tsx
│   ├── globals.css           # Design tokens (CSS variables) + Tailwind theme
│   └── (app)/                # Route group: các màn hình dùng DashboardTemplate
│       ├── layout.tsx        # Lắp organisms vào DashboardTemplate
│       ├── error.tsx         # Error boundary giữ nguyên shell
│       ├── dashboard/page.tsx
│       └── tasks/page.tsx
├── components/               # SHARED DESIGN SYSTEM (không có business logic)
│   ├── atoms/                # Button, Input, Select, Badge, Card, Spinner, Skeleton...
│   ├── molecules/            # FormField, SearchInput, Dialog, ConfirmationDialog, Pagination...
│   ├── organisms/            # AppSidebar, AppHeader, MobileNav, DataTable
│   └── templates/            # DashboardTemplate
├── features/                 # BUSINESS FEATURES
│   └── tasks/
│       ├── schemas.ts        # Zod schema = nguồn sự thật của domain
│       ├── types.ts          # Type suy ra từ schema + TaskRepository contract
│       ├── constants.ts      # Label, mapping status → badge
│       ├── actions.ts        # Server Actions (mutation)
│       ├── services/         # Data access: demo adapter, REST adapter, selector
│       └── components/       # UI riêng của feature: TaskTable, TaskForm...
├── lib/                      # Hạ tầng dùng chung, không phụ thuộc feature
│   ├── api/http-client.ts    # Typed fetch: timeout, ApiError, response validation
│   ├── api/backend.ts        # server-only: gọi backend với base URL + token
│   ├── env.ts                # server-only env (Zod)
│   ├── action-result.ts      # Kiểu trả về chuẩn của Server Action
│   ├── theme.ts              # Light/dark theme
│   └── utils.ts              # cn(), formatDate()
├── config/                   # navigation.tsx, site.ts
├── instrumentation.ts        # Chạy khi server start: validate env (fail fast)
└── test/                     # Vitest setup
e2e/                          # Playwright specs
docs/                         # Tài liệu kiến trúc và hướng dẫn
.storybook/                   # Cấu hình Storybook
.github/workflows/ci.yml      # CI
```

Chưa có `src/hooks/`, `src/providers/`, `src/types/` vì chưa có code nào cần đến. Khi cần thì tạo, theo quy tắc trong [docs/architecture.md](docs/architecture.md) (mục "Dependency rules").

## Testing

```bash
pnpm test                 # unit + component (jsdom)
pnpm test:coverage        # kèm coverage report trong ./coverage
pnpm exec playwright install chromium   # một lần
pnpm test:e2e             # E2E: local chạy `pnpm dev`, CI chạy `pnpm start`
```

| Loại      | Vị trí                      | Test gì                                                                      |
| --------- | --------------------------- | ---------------------------------------------------------------------------- |
| Unit      | `*.test.ts` cạnh file nguồn | Schema, repository, HTTP client, Server Actions (đã mock repository)         |
| Component | `*.test.tsx` cạnh component | Hành vi và accessibility: role, label, trạng thái disabled/error             |
| E2E       | `e2e/*.spec.ts`             | Luồng thật trên trình duyệt: CRUD task, filter, focus của dialog, mobile nav |

Quy ước:

- Query theo role và label (`getByRole('button', { name: 'Save' })`), không theo class CSS. Test như vậy cũng kiểm tra luôn accessibility.
- Async Server Component không render được bằng RTL. Hãy test logic của nó (repository, schema) bằng unit test, và test cả trang bằng E2E.
- jsdom chưa hỗ trợ `<dialog>.showModal()`. `src/test/setup.ts` có một stub tối thiểu; hành vi focus thật được kiểm tra bằng Playwright.

## Tạo project mới từ template

1. Copy repo (GitHub: **Use this template**, hoặc `git clone` rồi xóa `.git` và chạy `git init`).
2. Đổi `name` trong `package.json` và `NEXT_PUBLIC_APP_NAME`.
3. Đổi màu và font trong `src/app/globals.css` (chỉ sửa token, không sửa component).
4. Sửa menu trong `src/config/navigation.tsx`.
5. Thêm feature theo [docs/create-new-feature.md](docs/create-new-feature.md).
6. Nối backend theo [docs/api-integration.md](docs/api-integration.md): đặt `API_MODE=rest` và `API_BASE_URL`.
7. Khi không cần demo nữa: xóa `src/features/tasks`, `src/app/(app)/tasks`, item `Tasks` trong navigation, phần task trên dashboard và `e2e/tasks.spec.ts`.

## Production

```bash
pnpm build && pnpm start
```

> **Authentication (fail-closed):** template không tự chọn nhà cung cấp đăng nhập. Ở `API_MODE=rest`, cho tới khi bạn hiện thực `resolveSession()` trong `src/lib/auth-provider.ts`, mọi trang hiển thị "Sign-in required", mọi mutation bị từ chối, và **không request nào tới được backend**. Xem [docs/api-integration.md](docs/api-integration.md), mục "Authentication". Demo mode không cần đăng nhập.

- Demo mode lưu dữ liệu trong RAM của server: **mất khi restart** và **không chia sẻ giữa các instance**. Production phải dùng `API_MODE=rest`.
- Lỗi của Server Action được log ở server. Hãy gắn một error reporter (Sentry, Datadog...) tại `src/lib/action-result.ts` và `src/app/(app)/error.tsx`.
