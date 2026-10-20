# Audit: Production Readiness

- **Ngày:** 2026-10-20
- **Dựa trên:** [`nextjs-atomic-design-audit.md`](nextjs-atomic-design-audit.md), [`dependency-deep-audit.md`](dependency-deep-audit.md)
- **Phạm vi:** đóng hoặc ghi nhận các rủi ro còn lại trước khi tái sử dụng template. Giữ nguyên kiến trúc và baseline dependency đã duyệt.

## Kết luận

| Hạng mục                    | Verdict                                                                                                                                                                                                                                                              |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SEC-1 (thiếu auth)**      | **Đã giảm thiểu, fail-closed.** Ở REST mode, visitor chưa đăng nhập **không thể** đọc hay ghi dữ liệu backend, và cũng không thể "mượn" `API_TOKEN`. Đã kiểm chứng bằng unit test, mutation test, và trình duyệt thật với mock backend (backend nhận **0 request**). |
| **Authentication thật**     | **Chưa có (có chủ đích).** Contract đã sẵn sàng; phần tích hợp với nhà cung cấp đăng nhập cần quyết định từ phía backend.                                                                                                                                            |
| **Security headers và CSP** | **PASS.** CSP theo mẫu "Without Nonces" của tài liệu Next.js; 0 vi phạm CSP trong toàn bộ E2E, ở cả production lẫn dev.                                                                                                                                              |
| **CI**                      | **PASS khi chạy local; remote NOT VERIFIED.** Workflow qua `actionlint`, và mọi bước của CI đã chạy thành công trên một bản copy sạch. Chưa có lần chạy GitHub Actions thật: repo chưa có remote và toàn bộ thay đổi chưa commit.                                    |
| **Dependency stability**    | **PASS.** Không thêm package nào. Baseline giữ nguyên.                                                                                                                                                                                                               |
| **Template reusability**    | **PASS.** Đã thực sự xóa demo Task theo README trên bản copy sạch; mọi kiểm tra đều xanh.                                                                                                                                                                            |
| **Production-ready?**       | **Template: sẵn sàng để tái sử dụng. Deploy production: CHƯA.** Còn 2 blocker (mục 10): tích hợp auth thật, và commit + chạy CI xanh trên GitHub.                                                                                                                    |

## 1. Công cụ đã dùng

| Capability                                                                  | Mục đích                                                                                                                |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Tài liệu Next.js 16.4.2 đi kèm package (`node_modules/next/dist/docs/`)     | `content-security-policy.md`, `authentication-with-cache-components.md`, `unauthorized.md`, `instrumentation-client.md` |
| Context7 (`/colinhacks/zod/v4.6.5`)                                         | Đã dùng ở audit dependency (Zod Mini); ở phần này chỉ dùng tài liệu đi kèm package                                      |
| Subagent `code-modernization:security-auditor` (read-only)                  | Review đối kháng bản sửa SEC-1 và CSP: tìm đường vượt qua guard, cách parse env, spoofing, cache leak                   |
| Playwright (browser thật)                                                   | E2E; kịch bản REST với mock backend; tìm nguồn vi phạm CSP                                                              |
| actionlint v1.7.12 (binary chính thức, đã kiểm tra SHA-256, đặt ngoài repo) | Kiểm tra cú pháp và ngữ nghĩa của GitHub Actions workflow                                                               |
| Bản copy sạch (chỉ các file git sẽ commit, `node_modules` rỗng)             | Giả lập CI như một lần clone mới, và giả lập việc xóa demo                                                              |

## 2. SEC-1: Authentication và Authorization

### 2.1 Endpoint cần bảo vệ (đã kiểm kê)

| Endpoint                                                                                                               | Loại                        | Yêu cầu                                | Trước                | Sau                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------- | -------------------------------------- | -------------------- | --------------------------------------------------------------------------------------- |
| `createTaskAction`, `updateTaskAction`, `updateTaskStatusAction`, `deleteTaskAction` (`src/features/tasks/actions.ts`) | Server Action (POST public) | Có session và permission `tasks:write` | Không kiểm tra       | `requireSession(TASK_PERMISSIONS.write)` là dòng đầu tiên, chạy **trước** bước validate |
| `/tasks`, `/dashboard` (đọc qua repository)                                                                            | Server Component            | Có session                             | Không kiểm tra       | `getSession()` trong `<Suspense>`; null thì hiển thị "Sign-in required"                 |
| Mọi lời gọi backend (`backendRequest`)                                                                                 | Data access                 | Có session                             | Luôn gửi `API_TOKEN` | `requireSession()` chạy trước `fetch`; gửi token của user nếu có                        |
| Route Handler, `proxy.ts`                                                                                              |                             |                                        | Không có             | Không có (subagent đã xác nhận)                                                         |

### 2.2 Thiết kế (provider-independent, fail-closed)

```text
src/lib/auth.ts           Session, AuthError, getSession(), requireSession(), hasPermission()
src/lib/auth-provider.ts  resolveSession(): ĐIỂM TÍCH HỢP DUY NHẤT; mặc định trả null
src/lib/env.ts            AUTH_ALLOW_ANONYMOUS (z.stringbool, mặc định false)
```

| Chế độ                                        | `getSession()` trả về         | Ghi chú                                                                               |
| --------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| `API_MODE=demo`                               | Session demo (`*`)            | Giữ nguyên trải nghiệm phát triển local                                               |
| `API_MODE=rest` (mặc định)                    | `resolveSession()` → **null** | Fail-closed; in một cảnh báo `[auth]` khi có request đầu tiên                         |
| `API_MODE=rest` + `AUTH_ALLOW_ANONYMOUS=true` | Session ẩn danh (`*`)         | Lối thoát có chủ đích, chỉ dùng sau VPN/SSO gateway; server in cảnh báo khi khởi động |
| `API_MODE=rest` + đã hiện thực provider       | Session thật                  | `accessToken` được chuyển tới backend                                                 |

Lý do của từng lựa chọn:

- **Không dùng `unauthorized()` hay `forbidden()`:** vẫn là experimental (`authInterrupts`, theo `03-api-reference/04-functions/unauthorized.md`).
- **Không kiểm tra session ở top-level của layout:** sẽ chặn toàn bộ segment và phá static shell (`authentication-with-cache-components.md`, Step 2).
- **Đọc request-time data trước, rồi mới kiểm tra session** (`tasks/page.tsx`, `dashboard/page.tsx`): nếu không, nhánh "Sign-in required" bị tính sẵn lúc build vào static shell. Lỗi này do subagent phát hiện (P3-1); đã sửa và kiểm chứng bằng cách build ở REST mode rồi bật `AUTH_ALLOW_ANONYMOUS` chỉ lúc runtime.
- **`action-result.ts` nhận diện `AuthError` theo `name`**, không import: file này được cả client dùng, trong khi `auth.ts` là `server-only`.

### 2.3 Authentication integration contract

```ts
// src/lib/auth.ts
export type Session = {
  userId: string
  permissions: readonly string[] // ví dụ 'orders:write'; '*' = mọi quyền
  accessToken?: string // token của user; nếu có, được gửi tới backend thay cho API_TOKEN
}

// src/lib/auth-provider.ts: hàm DUY NHẤT dự án phải viết
export async function resolveSession(): Promise<Session | null>
```

Quy ước dùng cho mọi feature mới (đã cập nhật trong `docs/create-new-feature.md` và `docs/api-integration.md` §8):

1. **Server Action:** `await requireSession('<feature>:write')` là dòng đầu tiên trong `try`.
2. **Page đọc dữ liệu:** đọc request-time data trước, rồi `if (!(await getSession()))` hiển thị trạng thái "Sign-in required".
3. **Repository không đi qua REST** (ví dụ gọi thẳng DB): phải tự gọi `requireSession()`.
4. **`resolveSession()` nên trả về `accessToken`.** Nếu không, mọi user dùng chung quyền của service account, và backend không thể kiểm tra quyền sở hữu dữ liệu (rủi ro IDOR theo thiết kế).

### 2.4 Phần phụ thuộc backend (cần quyết định, chưa làm)

| Quyết định                      | Phương án                                                                                                                                                                                                     |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nhà cung cấp đăng nhập          | JWT do backend cấp (cookie `httpOnly`) / OIDC (Keycloak, Entra ID, Auth0) / session cookie của backend. Có ví dụ JWT + `/me` trong `docs/api-integration.md` §8; ví dụ này đã được kiểm tra typecheck và lint |
| Màn hình login và logout        | Route group `src/app/(auth)/` + `AuthTemplate`                                                                                                                                                                |
| Refresh token, thời hạn session | Theo IdP                                                                                                                                                                                                      |
| Danh sách permission            | Do backend trả về; map vào `Session.permissions`                                                                                                                                                              |
| Redirect ở `src/proxy.ts`       | Tùy chọn, chỉ là lớp UX (không thay thế việc kiểm tra ở action và data)                                                                                                                                       |

### 2.5 Bằng chứng

| Kiểm chứng                                              | Kết quả                                                                                                                                 |
| ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.test.ts`                                  | Demo có session; REST fail-closed; provider session + kiểm tra permission (`forbidden`); anonymous chỉ khi bật cờ                       |
| `src/lib/api/backend.test.ts`                           | Không có session: `fetch` **không được gọi**. Session của user: header `Bearer user-token`. Anonymous: `Bearer service-token`           |
| `src/features/tasks/actions.test.ts`                    | Cả 4 action trả lỗi "sign in" khi chưa đăng nhập và lỗi "permission" khi thiếu quyền; repository không bị gọi; auth chạy trước validate |
| `src/lib/env.test.ts`                                   | Parse thật biến `AUTH_ALLOW_ANONYMOUS`: `"false"`, `"0"`, `""` và không đặt đều cho `false`; `"maybe"` làm server dừng khi khởi động    |
| Mutation test                                           | Bỏ guard ở `backendRequest`: 2 test fail. Bỏ guard ở `createTaskAction`: 3 test fail. Khôi phục: pass lại                               |
| Trình duyệt + mock backend, REST mặc định               | `/dashboard`, `/tasks`: "Sign-in required"; thử tạo task: bị từ chối với "…not signed in…"; **backend nhận 0 request**                  |
| Trình duyệt + mock backend, `AUTH_ALLOW_ANONYMOUS=true` | Đọc và ghi hoạt động (lần đầu kiểm chứng **ghi** ở REST mode end-to-end); có cảnh báo `[auth]` khi khởi động                            |
| Subagent review đối kháng                               | **Không có đường vượt qua guard ở mức P0/P1.** Có 5 phát hiện P3, đã sửa tất cả (mục 3)                                                 |

## 3. Các thay đổi đã thực hiện

| File                                                                                                               | Thay đổi                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/auth.ts` (mới), `src/lib/auth-provider.ts` (mới)                                                          | Contract auth, chính sách fail-closed                                                                                                                                                        |
| `src/lib/env.ts`                                                                                                   | `AUTH_ALLOW_ANONYMOUS` (dùng `z.stringbool`, giá trị không hợp lệ thì dừng khởi động)                                                                                                        |
| `src/lib/api/backend.ts`                                                                                           | `requireSession()` trước mọi `fetch`; ưu tiên token của user                                                                                                                                 |
| `src/lib/action-result.ts`                                                                                         | Đổi `AuthError` thành message cho người dùng (không log thành lỗi)                                                                                                                           |
| `src/features/tasks/actions.ts`, `constants.ts`                                                                    | Guard `tasks:write` ở cả 4 action; hằng `TASK_PERMISSIONS`                                                                                                                                   |
| `src/app/(app)/tasks/page.tsx`, `dashboard/page.tsx`                                                               | Trạng thái "Sign-in required"; đọc request-time data trước khi kiểm tra session                                                                                                              |
| `src/instrumentation-node.ts`                                                                                      | Cảnh báo khi khởi động nếu `AUTH_ALLOW_ANONYMOUS=true`                                                                                                                                       |
| `next.config.ts`                                                                                                   | CSP và security headers; `poweredByHeader: false`                                                                                                                                            |
| `src/instrumentation-client.ts` (mới)                                                                              | `config({ jitless: true })` cho Zod (mục 4)                                                                                                                                                  |
| `e2e/fixtures.ts` (mới), `e2e/security.spec.ts` (mới), `e2e/tasks.spec.ts`                                         | Fixture tự động bắt vi phạm CSP cho **mọi** E2E test; test header và theme script                                                                                                            |
| `.github/workflows/ci.yml`                                                                                         | `permissions: contents: read`; thêm bước `pnpm audit --prod`                                                                                                                                 |
| `public/.gitkeep` (mới)                                                                                            | Sửa lỗi CI: thư mục `public/` rỗng không được git lưu, làm Storybook build fail khi clone mới                                                                                                |
| Test mới: `auth.test.ts`, `backend.test.ts`, `env.test.ts`; mở rộng `actions.test.ts`                              | 77 → **85** test                                                                                                                                                                             |
| `src/lib/**`, `src/components/**` (comment, test, story)                                                           | Đổi ví dụ "task" thành từ trung tính (`orders`, `item`), để tầng shared không nhắc tới demo                                                                                                  |
| `README.md`, `.env.example`, `docs/api-integration.md` §8, `docs/architecture.md` §9, `docs/create-new-feature.md` | Tài liệu contract auth; cờ `AUTH_ALLOW_ANONYMOUS`; tutorial dùng `requireSession` và id allowlist (trước đây tutorial dùng `typeof id === 'string'`, sẽ tái tạo lỗi SEC-2 ở mọi feature mới) |

## 4. Security headers và CSP

**Header được gửi trên mọi route** (`next.config.ts`):

| Header                    | Giá trị                                                                                                                                                                                                                                                 |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Content-Security-Policy` | `default-src 'self'; script-src 'self' 'unsafe-inline'` (thêm `'unsafe-eval'` khi dev)`; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |
| `X-Content-Type-Options`  | `nosniff`                                                                                                                                                                                                                                               |
| `Referrer-Policy`         | `strict-origin-when-cross-origin`                                                                                                                                                                                                                       |
| `X-Frame-Options`         | `DENY`                                                                                                                                                                                                                                                  |
| `Permissions-Policy`      | `camera=(), microphone=(), geolocation=(), browsing-topics=()`                                                                                                                                                                                          |
| `X-Powered-By`            | Đã tắt                                                                                                                                                                                                                                                  |

**Vì sao không dùng nonce:** tài liệu ghi rõ nonce yêu cầu mọi trang render động, và "**Partial Prerendering (PPR) is incompatible** with nonce-based CSP" (`02-guides/content-security-policy.md`, "Static vs Dynamic Rendering with CSP"). `/dashboard` và `/tasks` đang dùng PPR. Hash cho theme script cũng không giúp được gì: khi có hash, trình duyệt bỏ qua `'unsafe-inline'`, và các inline script RSC của chính Next sẽ bị chặn.

**Không đưa `upgrade-insecure-requests` vào mặc định:** directive này làm hỏng các deployment HTTP thuần trong mạng nội bộ (subagent P3-2). Bật lại khi chạy sau HTTPS; HSTS nên đặt ở proxy hoặc CDN.

**Phát hiện khi kiểm chứng.** Test CSP mới bắt được vi phạm thật trong production build: `script-src eval`.

- **Nguồn:** Zod v4 gọi thử `Function("")` để JIT-compile parser (`zod/v4/core/util.js:218`, `allowsEval`).
- **Hậu quả:** validation vẫn chạy (Zod tự chuyển sang cách khác), nhưng mỗi lần mở `/tasks` lại sinh một báo cáo vi phạm.
- **Sửa:** dùng API chính thức `config({ jitless: true })` trong `src/instrumentation-client.ts`, chỉ chạy ở trình duyệt.
- **Chi phí đo được:** `/dashboard` từ 187.3 → 192.6 KiB gzip (+5.3 KiB); `/tasks` +1.1 KiB.

**Kiểm chứng:**

- `e2e/security.spec.ts`: có header và không có `X-Powered-By`; theme script vẫn chạy dưới CSP.
- Fixture `e2e/fixtures.ts`: **mọi** test fail nếu có `securitypolicyviolation`. Mutation test: bỏ cấu hình `jitless` thì 7 test fail với "CSP violation: script-src eval"; khôi phục thì 9/9 pass.
- 9/9 E2E pass ở production (`CI=1`) và ở `pnpm dev`. Server Action (POST), theme toggle, dialog và điều hướng đều không bị chặn.

**Giới hạn còn lại:** `'unsafe-inline'` cho script nghĩa là CSP **không** ngăn được inline XSS. Lớp bảo vệ chính vẫn là React tự escape nội dung; `dangerouslySetInnerHTML` duy nhất trong app là một hằng số. Muốn CSP chặt hơn phải tắt PPR để dùng nonce, hoặc thử SRI (experimental).

## 5. CI và release

| Yêu cầu                                        | Trạng thái          | Bằng chứng                                                                                              |
| ---------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| Node khớp `.nvmrc`                             | ✅                  | `actions/setup-node@v7` với `node-version-file: .nvmrc` (24)                                            |
| pnpm khớp `packageManager`                     | ✅                  | `pnpm/action-setup@v6` không đặt `version`, nên đọc `pnpm@12.11.2`                                      |
| Cài với frozen lockfile                        | ✅ local            | Bản copy sạch: "Lockfile is up to date"                                                                 |
| Typecheck, ESLint, unit test, build, Storybook | ✅ local            | Bản copy sạch: tất cả exit 0 (sau khi sửa `public/`)                                                    |
| Playwright                                     | ✅ local            | Bản copy sạch: 9/9. Bước `--with-deps` chỉ có tác dụng trên Linux, chưa kiểm chứng trên ubuntu          |
| Cú pháp workflow                               | ✅                  | `actionlint` 1.7.12: không có lỗi                                                                       |
| Bảo mật workflow                               | ✅ (đã sửa)         | Thêm `permissions: contents: read`                                                                      |
| Chạy trên GitHub Actions                       | ❌ **NOT VERIFIED** | Không có `git remote`; chỉ 17 file được track; `pnpm-lock.yaml`, `.nvmrc` và toàn bộ `src/` chưa commit |

**Lỗi CI thật đã tìm và sửa:** thư mục `public/` chỉ còn rỗng sau khi xóa các SVG mẫu. Git không lưu thư mục rỗng, nên bản clone không có `public/`, và `storybook build` fail với "no such directory: ./public" (do `staticDirs`). Khi chạy local lỗi bị che vì thư mục rỗng vẫn tồn tại. Đã thêm `public/.gitkeep`.

**Khuyến nghị (chưa làm):** pin action theo commit SHA để chống tấn công supply chain qua tag; cân nhắc dùng Dependabot hoặc Renovate để cập nhật.

## 6. Dependency stability

- **Không thêm package nào.** Không có Zustand, TanStack Query, Axios hay thư viện auth. Storybook được giữ.
- Không nâng major nào. Không dùng override.
- **SEC-6:** vẫn chỉ theo dõi (dev-only, chưa có bản vá). CI chạy `pnpm audit --prod` (không có lỗ hổng), nên không bị fail vì lỗ hổng chỉ nằm ở dev.
- `zod/v4/core` là subpath của package `zod` đã cài sẵn, không phải dependency mới.

## 7. Template reusability

| Bước                        | Kết quả | Bằng chứng                                                                                                    |
| --------------------------- | ------- | ------------------------------------------------------------------------------------------------------------- |
| 1. Clone                    | ✅      | Bản copy sạch chỉ có các file git sẽ commit                                                                   |
| 2. Cấu hình env             | ✅      | `.env.example` có đủ biến, kể cả `AUTH_ALLOW_ANONYMOUS`; env sai thì server dừng khi khởi động                |
| 3. Chạy app                 | ✅      | `pnpm dev` và `pnpm start`; E2E 9/9 ở cả hai                                                                  |
| 4. Xóa demo Task            | ✅      | Làm đúng README bước 7 trên bản copy: typecheck, lint, 35 unit test, build, Storybook và 2 E2E chung đều pass |
| 5. Thêm feature             | ✅      | Code tutorial Product (đã cập nhật auth) qua typecheck và lint                                                |
| 6. Nối REST backend         | ✅      | Mock backend: fail-closed mặc định; đọc và ghi hoạt động khi có session                                       |
| 7. Dùng lại component chung | ✅      | Sau khi xóa demo, `src/components` và `src/lib` không còn tham chiếu nào tới "task"                           |
| 8. Test và build production | ✅      | Mục 9                                                                                                         |

Thay đổi để giữ template trung lập: CSP check được chuyển thành fixture dùng chung thay vì đi theo luồng Task, nên **không bị hỏng khi xóa demo**.

## 8. Rủi ro còn lại

| ID  | Mức             | Rủi ro                                                                                                         | Giảm thiểu                                                                                        |
| --- | --------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| R1  | Blocker deploy  | Chưa có auth thật: REST mode từ chối mọi thứ cho tới khi hiện thực `resolveSession()`                          | Có chủ đích (fail-closed); contract và ví dụ trong `docs/api-integration.md` §8                   |
| R2  | Blocker release | CI chưa chạy trên GitHub; code chưa commit                                                                     | Commit (bao gồm `pnpm-lock.yaml`, `.nvmrc`, `public/.gitkeep`), push, xác nhận 2 job xanh         |
| R3  | P2              | Bật `AUTH_ALLOW_ANONYMOUS=true` sai chỗ sẽ trao toàn quyền `API_TOKEN` cho mọi visitor                         | Mặc định `false`; có cảnh báo khi khởi động; giá trị không hợp lệ thì dừng; có ghi trong tài liệu |
| R4  | P2              | Provider không trả `accessToken` thì backend coi mọi user là service account (IDOR theo thiết kế)              | Có ghi trong docblock của `auth-provider.ts` và docs §8                                           |
| R5  | P3              | CSP có `'unsafe-inline'`, không chặn được inline XSS                                                           | React tự escape; nonce không tương thích với PPR (mục 4)                                          |
| R6  | P3              | Không có `upgrade-insecure-requests` và HSTS                                                                   | Đặt ở tầng HTTPS (proxy hoặc CDN)                                                                 |
| R7  | P3              | Không có rate limiting cho Server Actions                                                                      | Tài liệu Next khuyến nghị cho thao tác tốn kém; đặt ở gateway hoặc backend                        |
| R8  | P3              | REST fail-closed chưa có E2E tự động (mới có unit test, mutation test và kiểm chứng thủ công trên trình duyệt) | Có thể thêm project Playwright thứ hai với mock backend (`next start` trên cổng riêng)            |
| R9  | P3              | SEC-6 (`braces`, dev-only), ESLint 9 deprecated (DEP-2)                                                        | Theo dõi upstream                                                                                 |
| R10 | P3              | Demo mode nếu deploy công khai thì ai cũng sửa được dữ liệu demo (tối đa 500 task, nằm trong RAM)              | Chấp nhận được cho demo; production phải dùng `API_MODE=rest`                                     |

## 9. Kết quả kiểm tra (đã chạy thật, sau mọi thay đổi)

| Lệnh                                               | Kết quả                                                           |
| -------------------------------------------------- | ----------------------------------------------------------------- |
| `pnpm install --frozen-lockfile`                   | Lockfile is up to date                                            |
| `pnpm audit --prod`                                | No known vulnerabilities found                                    |
| `pnpm audit`                                       | 1 high (SEC-6, dev-only)                                          |
| `pnpm typecheck`, `pnpm lint`, `pnpm format:check` | Pass                                                              |
| `pnpm test`                                        | **85/85** (15 file)                                               |
| `pnpm test:coverage`                               | 70.3% statements (trước: 65.2%)                                   |
| `pnpm build`                                       | Pass; `/dashboard`, `/tasks` vẫn là `◐` Partial Prerender         |
| `CI=1 pnpm test:e2e` (production)                  | **9/9**, 0 vi phạm CSP                                            |
| `pnpm test:e2e` (dev)                              | **9/9**                                                           |
| `pnpm build-storybook`                             | Pass                                                              |
| `actionlint .github/workflows/ci.yml`              | Không có lỗi                                                      |
| CI giả lập trên bản copy sạch                      | Mọi bước exit 0                                                   |
| Xóa demo trên bản copy sạch                        | Mọi kiểm tra pass                                                 |
| Build ở REST mode, bật anonymous lúc runtime       | Không có cảnh báo `[auth]` lúc build; trang hiển thị dữ liệu thật |
| GitHub Actions remote                              | **NOT VERIFIED**                                                  |

## 10. Final Production-Readiness Verdict

- **Template tái sử dụng: SẴN SÀNG.** Kiến trúc, dependency, bảo mật mặc định (fail-closed, CSP), CI và tài liệu đều đã được kiểm chứng; việc xóa demo đã được thử thật.
- **Một ứng dụng production dựng từ template: CHƯA SẴN SÀNG** cho tới khi:
  1. Hiện thực `resolveSession()` với nhà cung cấp đăng nhập thật, và trả `accessToken` (R1, R4).
  2. Commit, push và xác nhận GitHub Actions xanh (R2).
  3. Đặt HTTPS, HSTS và rate limiting ở tầng hạ tầng (R6, R7).

Rủi ro authorization nghiêm trọng (visitor ẩn danh dùng `API_TOKEN`) **không còn mặc định**. Nó chỉ quay lại nếu có người cố ý bật `AUTH_ALLOW_ANONYMOUS=true`.
