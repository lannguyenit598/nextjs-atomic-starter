# Audit chuyên sâu: Dependencies

- **Ngày:** 2026-10-20
- **Dựa trên:** [`nextjs-atomic-design-audit.md`](nextjs-atomic-design-audit.md). Mọi kết luận về dependency trong báo cáo đó đều được **kiểm chứng lại độc lập**, không mặc nhiên tin.
- **Nguồn sự thật:** `package.json` và `pnpm-lock.yaml`.

## Executive Summary

**Stack dependency hiện tại phù hợp với dự án. Không có dependency thừa ở runtime.**

| Câu hỏi                                    | Kết luận                                                                                                                                                                                     |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dependency có phù hợp không?               | **Có.** Chỉ có 11 runtime dependency, kéo theo 14 package trong lockfile. Mỗi package đều có nơi dùng thật và không trùng trách nhiệm với nhau.                                              |
| Có package thừa hoặc trùng lặp không?      | **Không có package nào cần xóa.** Knip không tìm thấy dependency thừa. `clsx` trông như trùng với CVA, nhưng chính CVA đã phụ thuộc vào `clsx`, nên giữ nó không tốn thêm gì.                |
| Các version có tương thích với nhau không? | **Có**, kèm 2 điểm cần lưu ý (đã sửa): `engines.node` khai báo rộng hơn mức các tool thực sự hỗ trợ, và range version của các package Tailwind không đồng nhất.                              |
| SEC-6 còn không?                           | **Còn** (CVE-2026-93687, chưa có bản vá). Lỗ hổng chỉ nằm ở dev tool, và đoạn code dính lỗi **không bao giờ được gọi** trong repo này. Mức thực tế: **Low/Informational**. Chỉ cần theo dõi. |
| Đã sẵn sàng làm template lâu dài chưa?     | **Có, về mặt dependency.** Rủi ro dài hạn nằm ở ESLint 9 (bị đánh dấu deprecated, nhưng bị chặn bởi plugin của Next) và Storybook (chiếm 39% cây dependency).                                |

## 1. Công cụ đã dùng

| Capability                                         | Đã dùng        | Mục đích                                                                                                                                 |
| -------------------------------------------------- | -------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Subagent `code-modernization:security-auditor`     | Có (read-only) | Điều tra độc lập SEC-6: `pnpm audit/why/outdated`, đọc GitHub Advisory API, đọc source của `braces`, phân tích exploitability            |
| Knip 6.42.0 (`pnpm dlx`, không cài vào repo)       | Có             | Tìm dependency, file và export không được dùng (có plugin cho Next, Vitest, Storybook, Playwright, ESLint, Prettier, Husky, lint-staged) |
| `next analyze --output` (Next 16.1+)               | Có             | Bundle analyzer chính thức của Turbopack                                                                                                 |
| esbuild 0.28.2 (đã có sẵn trong `node_modules`)    | Có             | Đo kích thước từng thư viện khi bundle riêng lẻ                                                                                          |
| Context7                                           | Có             | Tài liệu Zod v4.6.5 (Zod Mini). Next.js: dùng tài liệu đi kèm package `node_modules/next/dist/docs/`, đúng version 16.4.2                |
| `pnpm peers check`, `pnpm list --json`, `npm view` | Có             | Kiểm tra peer dependency, cây phụ thuộc và thông tin trên registry                                                                       |
| Skill chuyên về dependency                         | Không có       | Trong môi trường không có skill nào dành riêng cho việc audit dependency                                                                 |

## 2. Baseline: kiểm tra lại với lockfile

Tất cả version mà báo cáo trước ghi đều **khớp** với `pnpm-lock.yaml` (lockfile v9.0). Lockfile có tổng cộng **718 package**.

| Hạng mục             | Thực tế                                                        | Nguồn / ràng buộc                                                                                                                                                                                                                                                            |
| -------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node local           | v24.15.0                                                       | `node -v`                                                                                                                                                                                                                                                                    |
| Node yêu cầu (trước) | `>=22`                                                         | `package.json` engines: **sai, quá rộng**                                                                                                                                                                                                                                    |
| Node yêu cầu thật    | `^22.22.2 \|\| ^24.15.0 \|\| >=26`                             | Giao của engines các tool: jsdom 30 `^22.22.2 \|\| ^24.15.0 \|\| >=26`, Vitest 5 `^22.12 \|\| ^24 \|\| >=26` (không hỗ trợ Node 25), lint-staged 17 `>=22.22.1`, Vite 8 `^20.19 \|\| >=22.12`. Next.js yêu cầu `>=20.9.0` (`docs/01-app/02-guides/upgrading/version-16.md`). |
| CI                   | `node-version: 24` (trước), nay là `node-version-file: .nvmrc` | `.github/workflows/ci.yml`                                                                                                                                                                                                                                                   |
| pnpm                 | 12.11.2                                                        | `packageManager`; CI dùng `pnpm/action-setup@v6`, tự đọc từ field này                                                                                                                                                                                                        |
| `.npmrc`             | Không có                                                       | Cấu hình pnpm nằm trong `pnpm-workspace.yaml` (`allowBuilds`)                                                                                                                                                                                                                |

## 3. Dependency Inventory

Ghi chú:

- "Nơi dùng" được xác định bằng grep trong source, config và scripts, rồi đối chiếu với Knip.
- Kích thước client lấy từ đo thực tế ở mục 6.

### `dependencies` (runtime)

| Package                  | Version             | Nơi dùng thực tế                                                                                                                                               | Mức cần thiết  | Đánh giá                                                                             | Đề xuất                  |
| ------------------------ | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------ | ------------------------ |
| next                     | 16.4.2              | Framework                                                                                                                                                      | Core           | Bản stable mới nhất                                                                  | KEEP                     |
| react / react-dom        | 19.3.0 → **19.3.1** | Khai báo cho tooling. **App Router chạy bằng React đi kèm Next** (`19.3.0-canary-278794d7-20261002`), theo `docs/01-app/01-getting-started/01-installation.md` | Core           | Bản patch 19.3.1 chỉ ảnh hưởng tới Vitest/RTL và Storybook                           | UPGRADE (**đã áp dụng**) |
| zod                      | 4.6.7               | 7 file: env, schemas, actions, `http-client` (type), `action-result`, TaskForm                                                                                 | Core           | Một schema dùng cho cả client, server và kiểm tra response từ backend                | KEEP                     |
| react-hook-form          | 7.90.0              | 1 file (`task-form.tsx`)                                                                                                                                       | Feature-level  | Đáng giá cho form admin phức tạp. Đổi lại form không chạy được khi tắt JS (NX-2)     | KEEP                     |
| @hookform/resolvers      | 5.9.2               | 1 file                                                                                                                                                         | Đi cùng RHF    | Peer `zod ^3.25 \|\| ^4`; code dùng `zod/v4/core`                                    | KEEP                     |
| class-variance-authority | 0.7.1               | 4 atom/molecule                                                                                                                                                | Core UI        | Quản lý variant có type                                                              | KEEP                     |
| clsx                     | 2.1.1               | `src/lib/utils.ts`                                                                                                                                             | Core UI        | CVA đã phụ thuộc `clsx ^2.1.1`, nên bỏ đi cũng **không giảm** package hay byte nào   | KEEP                     |
| tailwind-merge           | 3.7.0               | `cn()`                                                                                                                                                         | Core UI        | Cần cho việc override `className` (đã có test chứng minh). Tốn 8.3 KiB gzip ở client | KEEP                     |
| lucide-react             | 1.59.0              | 17 file                                                                                                                                                        | Core UI        | 17 icon chỉ tốn 3.1 KiB gzip (tree-shaking tốt)                                      | KEEP                     |
| server-only              | 0.0.1               | 6 file                                                                                                                                                         | Core (bảo mật) | Next.js khuyến nghị dùng (`02-guides/data-security.md`)                              | KEEP                     |

Không có package nào nên chuyển sang `devDependencies`: tất cả đều được bundle vào app hoặc dùng làm marker khi build.

### `devDependencies`

| Package                                      | Version | Nơi dùng thực tế                                                        | Mức cần thiết    | Đánh giá                                                                                                                                     | Đề xuất                  |
| -------------------------------------------- | ------- | ----------------------------------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| typescript                                   | 5.9.3   | `tsc`, Next                                                             | Dev core         | Next yêu cầu ≥ 5.1; `typescript-eslint` yêu cầu `<6.1`, nên chưa lên TS 6/7 được                                                             | KEEP                     |
| @types/node                                  | 24.19.2 | Type                                                                    | Dev core         | Bản 26 đã có. Khớp với Node 24 trong `.nvmrc`                                                                                                | KEEP                     |
| @types/react, @types/react-dom               | 19.3.0  | Type                                                                    | Dev core         | Next 16 yêu cầu dùng bản mới nhất (version-16.md)                                                                                            | KEEP                     |
| tailwindcss                                  | 4.3.3   | `@import 'tailwindcss'` trong `globals.css`                             | Dev core (build) | Range `^4` → **`^4.3.3`**                                                                                                                    | KEEP (đã chỉnh range)    |
| @tailwindcss/turbopack                       | 4.3.3   | `next.config.ts` (CSS loader)                                           | Dev core (build) | Range `^4` → **`^4.3.3`** để đi cùng `tailwindcss`                                                                                           | KEEP (đã chỉnh range)    |
| eslint                                       | 9.39.5  | `pnpm lint`                                                             | Dev core         | **npm đánh dấu deprecated.** ESLint 10 bị chặn vì peer dependency của `eslint-plugin-react`, `jsx-a11y`, `import` trong `eslint-config-next` | KEEP, chờ upstream (P2)  |
| eslint-config-next                           | 16.4.2  | `eslint.config.mjs`                                                     | Dev core         | Là nguồn của SEC-6 (mục 5)                                                                                                                   | KEEP                     |
| eslint-config-prettier                       | 10.1.8  | `eslint.config.mjs`                                                     | Dev core         | Tắt các rule xung đột với Prettier                                                                                                           | KEEP                     |
| prettier                                     | 3.9.10  | `format` scripts                                                        | Dev core         |                                                                                                                                              | KEEP                     |
| prettier-plugin-tailwindcss                  | 0.8.1   | `.prettierrc.json`                                                      | Dev (DX)         | Tự sắp xếp class Tailwind                                                                                                                    | KEEP                     |
| husky                                        | 9.1.7   | `prepare` script, `.husky/pre-commit`                                   | Dev (DX)         |                                                                                                                                              | KEEP                     |
| lint-staged                                  | 17.6.0  | `.husky/pre-commit`                                                     | Dev (DX)         | Yêu cầu Node `>=22.22.1`                                                                                                                     | KEEP                     |
| vitest                                       | 5.0.5   | `test*` scripts                                                         | Test             |                                                                                                                                              | KEEP                     |
| @vitest/coverage-v8                          | 5.0.5   | `provider: 'v8'` (`vitest.config.mts`), `test:coverage`                 | Test             | Peer bắt buộc cùng version với `vitest`                                                                                                      | KEEP                     |
| vite                                         | 8.3.4   | Peer của Vitest, `@vitejs/plugin-react`, `@tailwindcss/vite`, Storybook | Test/Storybook   | Khai báo trực tiếp để cố định version peer dùng chung                                                                                        | KEEP                     |
| @vitejs/plugin-react                         | 6.1.2   | `vitest.config.mts`                                                     | Test             | Peer `vite ^8`                                                                                                                               | KEEP                     |
| jsdom                                        | 30.1.3  | `environment: 'jsdom'`                                                  | Test             | Chưa hỗ trợ `<dialog>.showModal()`; đã có stub                                                                                               | KEEP                     |
| @testing-library/react                       | 16.3.3  | 9 file test                                                             | Test             |                                                                                                                                              | KEEP                     |
| @testing-library/dom                         | 10.4.2  | Không import trực tiếp                                                  | Test             | **Peer bắt buộc** của RTL 16 (`^10.0.0`). Không phải package thừa                                                                            | KEEP                     |
| @testing-library/jest-dom                    | 7.0.1   | `src/test/setup.ts`                                                     | Test             |                                                                                                                                              | KEEP                     |
| @testing-library/user-event                  | 14.6.8  | 4 file test                                                             | Test             | Không chạy được với fake timer của Vitest 5 (`task-filters.test.tsx` dùng `fireEvent` thay thế)                                              | KEEP                     |
| @playwright/test                             | 1.64.1  | `playwright.config.ts`, `e2e/`                                          | Test             | Next khai báo peer `^1.51.1`                                                                                                                 | KEEP                     |
| storybook                                    | 10.6.2  | `storybook`, `build-storybook`                                          | Docs             | **Thêm 279 package mà không gì khác cần** (mục 6)                                                                                            | OPTIONAL (P3, xem mục 9) |
| @storybook/nextjs-vite                       | 10.6.2  | `.storybook/main.ts`, 12 story                                          | Docs             | Peer `next ^16`, `vite ^8`                                                                                                                   | Đi cùng Storybook        |
| @storybook/addon-docs, @storybook/addon-a11y | 10.6.2  | `.storybook/main.ts`                                                    | Docs             | a11y giúp kiểm tra accessibility ngay khi viết component                                                                                     | Đi cùng Storybook        |
| @tailwindcss/vite                            | 4.3.3   | `.storybook/main.ts`                                                    | Docs             | Chỉ Storybook cần (Next dùng Turbopack loader)                                                                                               | Đi cùng Storybook        |
| eslint-plugin-storybook                      | 10.6.2  | `eslint.config.mjs`                                                     | Docs             |                                                                                                                                              | Đi cùng Storybook        |

**Kết quả Knip:**

- Không có dependency thừa, thiếu khai báo hay import không resolve được.
- 2 file bị báo "unused":
  - `separator.tsx`: atom có trong yêu cầu nhưng app chưa dùng.
  - `empty-module.ts`: **false positive**, vì được dùng qua alias trong `vitest.config.mts`.
- 3 export và 5 type export không được dùng. Đây là API công khai của module, không liên quan tới dependency.

## 4. Compatibility Matrix

| Tổ hợp                                                                  | Kết quả                | Bằng chứng                                                                                             |
| ----------------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Next 16.4.2 ↔ React/React DOM 19.3.1                                    | ✅                     | Peer `^18.2.0 \|\| ^19.0.0`; App Router dùng React đi kèm Next                                         |
| Next 16.4.2 ↔ Node                                                      | ✅                     | Yêu cầu ≥ 20.9; local 24.15.0; CI dùng `.nvmrc` (24)                                                   |
| Next 16.4.2 ↔ TypeScript 5.9.3                                          | ✅                     | Yêu cầu ≥ 5.1.0 (version-16.md)                                                                        |
| Next 16 ↔ ESLint                                                        | ✅                     | Dùng flat config và `eslint .`; `next lint` đã bị bỏ (version-16.md)                                   |
| eslint-config-next 16.4.2 ↔ ESLint 10                                   | ❌ (chặn)              | Plugin import/jsx-a11y/react chỉ hỗ trợ tới ESLint `^9`; `typescript-eslint` yêu cầu TS `<6.1.0`       |
| Zod 4.6.7 ↔ @hookform/resolvers 5.9.2 ↔ RHF 7.90                        | ✅                     | Peer `zod ^3.25 \|\| ^4`, `react-hook-form ^7.55`; resolver dùng type từ `zod/v4/core`                 |
| Tailwind 4.3.3 ↔ @tailwindcss/turbopack 4.3.3 ↔ @tailwindcss/vite 4.3.3 | ✅                     | Cùng version; nay cùng range `^4.3.3`                                                                  |
| prettier-plugin-tailwindcss 0.8.1 ↔ Prettier 3 / Tailwind 4             | ✅                     | Peer `prettier ^3.0`; đọc `tailwindStylesheet`                                                         |
| Vitest 5.0.5 ↔ Vite 8.3.4 ↔ @vitejs/plugin-react 6.1.2                  | ✅                     | Peer `vite ^8`                                                                                         |
| Vitest 5 ↔ jsdom 30 ↔ Node                                              | ✅ khi Node đúng range | jsdom không hỗ trợ Node 24.0–24.14 và Node 25                                                          |
| RTL 16.3.3 ↔ React 19 ↔ @testing-library/dom 10                         | ✅                     | Peer `react ^19`, `@testing-library/dom ^10`                                                           |
| Storybook 10.6.2 ↔ Next 16 ↔ Vite 8                                     | ✅                     | Peer `next ^16`, `vite ^8`; `build-storybook` pass                                                     |
| Playwright 1.64.1 ↔ Next                                                | ✅                     | Peer `^1.51.1`                                                                                         |
| Toàn bộ cây                                                             | ✅                     | `pnpm peers check`: "No peer dependency issues found"; `pnpm install --frozen-lockfile`: lockfile khớp |

## 5. Security Analysis: điều tra lại SEC-6

| Câu hỏi                       | Kết quả (đã kiểm chứng)                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Còn tồn tại?               | **Còn.** `pnpm audit`: 1 high; `pnpm audit --prod`: không có lỗ hổng                                                                                                                                                                                                                                                                                                                                                                                            |
| 2. Mã advisory                | **GHSA-vfj7-8cjw-p6xm**, CVE-2026-93687, công bố 2026-09-18, CWE-674 (Uncontrolled Recursion), CVSS 3.1: 7.5, CVSS 4.0: 8.7                                                                                                                                                                                                                                                                                                                                     |
| 3. Version bị ảnh hưởng       | `braces@3.0.3` (range `<=3.0.3`). Đây là version mới nhất trên registry                                                                                                                                                                                                                                                                                                                                                                                         |
| 4. Chuỗi phụ thuộc (duy nhất) | `eslint-config-next@16.4.2 → @next/eslint-plugin-next@16.4.2 → fast-glob@3.3.1 (pin cứng) → micromatch@4.0.8 → braces@3.0.3`                                                                                                                                                                                                                                                                                                                                    |
| 5. Runtime hay dev?           | **Chỉ dev.** Không có chuỗi nào đi qua `dependencies`. `.next/*.nft.json` và `.next/server`, `.next/static` không chứa `braces`, `micromatch` hay `fast-glob`                                                                                                                                                                                                                                                                                                   |
| 6. Điều kiện khai thác        | Pattern brace lồng sâu làm 3 hàm đệ quy không giới hạn độ sâu (`lib/compile.js:7`, `lib/expand.js:36`, `lib/stringify.js:6`) gây stack overflow. Plugin chỉ gọi fast-glob trong `get-root-dirs.js` (rule `no-html-link-for-pages`), **và chỉ khi có `settings.next.rootDir`**. Repo **không đặt** setting này, nên đoạn code dính lỗi không bao giờ chạy. Muốn khai thác phải sửa được file cấu hình ESLint, mà người đó vốn đã chạy được code tùy ý qua ESLint |
| 7. Có bản vá tương thích?     | **Không.** `first_patched_version: null`                                                                                                                                                                                                                                                                                                                                                                                                                        |
| 8. Sửa bằng cách nâng parent? | **Không.** 16.4.2 là bản latest; canary 16.5.0-canary.19 vẫn pin `fast-glob 3.3.1`                                                                                                                                                                                                                                                                                                                                                                              |
| 9. Dùng override có an toàn?  | **Vô ích.** Không có bản vá của braces để override tới; mọi bản micromatch đều cần `braces ^3.0.3`                                                                                                                                                                                                                                                                                                                                                              |
| 10. Có cần xử lý ngay?        | **Không.** Mức thực tế là Low/Informational (tệ nhất: process `eslint` bị crash). **Theo dõi** advisory; khi có `braces` bản mới thì thêm override hoặc nâng version. Nếu CI chạy `pnpm audit`, dùng `pnpm audit --ignore GHSA-vfj7-8cjw-p6xm`                                                                                                                                                                                                                  |

**Lỗ hổng khác:** không có (high 1, các mức còn lại 0).

**Ghi chú môi trường:**

- `node_modules/.pnpm` còn sót bản `eslint-config-next` được build cho `eslint@10.13.0`, từ một lần cài thử trước đó.
- Lockfile không tham chiếu tới bản này. Đây chỉ là rác trên máy local, không ảnh hưởng gì tới repo.

## 6. Bundle and Runtime Impact

Tất cả số liệu dưới đây là **đo thật** trên bản production build: lấy các file JS mà HTML của route tham chiếu, rồi nén gzip -9.

| Route                | Số file JS | Raw       | Gzip          |
| -------------------- | ---------- | --------- | ------------- |
| `/dashboard`         | 10         | 603.9 KiB | **187.3 KiB** |
| `/tasks`             | 12         | 757.4 KiB | **234.1 KiB** |
| Phần chỉ `/tasks` có | 2          |           | **46.8 KiB**  |

- Chunk lớn nhất dùng chung là `react-dom` (71.6 KiB gzip).
- Phần riêng của `/tasks` chủ yếu là một chunk 46.1 KiB gzip, chứa Zod (chỉ locale `en`), RHF, resolver và code form.
- Dashboard **không tải** Zod hay RHF: code splitting theo route đang hoạt động đúng.

Đo từng thư viện khi bundle riêng (esbuild, minify, gzip -9, đã loại React):

| Thư viện                                         | Gzip         | Ghi chú                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| react-hook-form (`useForm`)                      | 11.5 KiB     |                                                                                                                                                                                                                                                                                                           |
| @hookform/resolvers/zod                          | 2.0 KiB      |                                                                                                                                                                                                                                                                                                           |
| lucide-react (17 icon đang dùng)                 | 3.1 KiB      |                                                                                                                                                                                                                                                                                                           |
| class-variance-authority + clsx + tailwind-merge | 8.8 KiB      | 8.3 KiB trong đó là tailwind-merge                                                                                                                                                                                                                                                                        |
| zod/mini (cùng schema)                           | 6.5 KiB      |                                                                                                                                                                                                                                                                                                           |
| zod (classic)                                    | ~~90.8 KiB~~ | **Số đo không hợp lệ:** esbuild không tree-shake được namespace `z`, nên kéo theo cả 257 locale. Trong bundle thật, Turbopack chỉ giữ locale `en`. Ước tính phần Zod trong chunk 46 KiB là **khoảng 25–30 KiB**; đây là **ước tính, chưa đo trực tiếp**. Tài liệu Zod ghi khoảng 13 KB cho schema object. |

**Kết luận về bundle:**

- **Không phát hiện vấn đề cụ thể nào.** Module server-only không bị lộ ra client (đã grep), và icon được tree-shake.
- Lựa chọn lớn nhất còn lại là Zod classic so với Zod Mini. Tài liệu chính thức của Zod khuyên **giữ Zod classic**, trừ khi giới hạn bundle "uncommonly strict" (`packages/docs/content/packages/mini.mdx`, v4.6.5). Vì vậy **không đề xuất đổi**.

**Kích thước cây dependency** (`pnpm list --json`, 718 package):

| Nhóm                     | Số package trong closure | Số package chỉ nhóm này cần (bỏ được nếu bỏ nhóm) |
| ------------------------ | ------------------------ | ------------------------------------------------- |
| Runtime (`dependencies`) | 14                       | 9                                                 |
| Storybook (6 package)    | 344                      | **279 (39%)**                                     |
| ESLint (3 package)       | 307                      | 272                                               |
| Vitest + RTL (9 package) | 83                       | 55                                                |
| Playwright               | 3                        | 2                                                 |

Thời gian build không đáng kể khi đã có cache: `build-storybook` khoảng 2 giây, `next build` khoảng 3 giây. Cái giá chính của Storybook là **kích thước cài đặt và số dependency phải bảo trì**, không phải thời gian build.

## 7. Redundancy và over-engineering

| Nghi vấn                                                | Kết luận                                                                                                                                                          |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `clsx` và `tailwind-merge` và CVA trùng nhau?           | **Không.** Mỗi package làm một việc: điều kiện, giải xung đột class, variant. CVA đã phụ thuộc `clsx`.                                                            |
| Có cần TanStack Query không?                            | **Không.** Không có nhu cầu đọc dữ liệu phía client: đọc bằng Server Component, ghi bằng Server Action, filter nằm trên URL. Thêm vào chỉ để có thêm abstraction. |
| Có cần global state (Zustand/Redux)?                    | **Không.** Không có state nào phải chia sẻ giữa nhiều nhánh UI.                                                                                                   |
| Có cần axios hay thư viện HTTP?                         | **Không.** `fetch`, `AbortSignal.timeout` và `AbortSignal.any` đã đủ (`src/lib/api/http-client.ts`).                                                              |
| Có cần thư viện date (date-fns, dayjs)?                 | **Chưa.** `Intl.DateTimeFormat` đủ cho nhu cầu hiện tại.                                                                                                          |
| Có cần headless UI (Radix)?                             | **Không.** `<dialog>` và `<select>` native đã đáp ứng; axe-core và E2E đã xác nhận focus trap hoạt động.                                                          |
| `@tailwindcss/vite` trùng với `@tailwindcss/turbopack`? | **Không.** Hai bundler khác nhau (Storybook dùng Vite, Next dùng Turbopack).                                                                                      |

## 8. Recommended Dependency Baseline

**Core dependencies** (gần như dự án nào cũng cần):

`next`, `react`, `react-dom`, `zod`, `server-only`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`

**Form (giữ mặc định, có thể bỏ):** `react-hook-form`, `@hookform/resolvers`

- Hai package này có ích cho form admin (nhiều field, lỗi theo từng field).
- Dự án chỉ có form đơn giản có thể dùng `<form action>` + `useActionState` + Zod, và có thêm progressive enhancement.

**Development dependencies:**

- **Build:** `typescript`, `@types/*`, `tailwindcss`, `@tailwindcss/turbopack`
- **Quality:** `eslint`, `eslint-config-next`, `eslint-config-prettier`, `prettier`, `prettier-plugin-tailwindcss`, `husky`, `lint-staged`
- **Test:** `vitest`, `@vitest/coverage-v8`, `vite`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/{react,dom,jest-dom,user-event}`, `@playwright/test`
- **Docs (tùy chọn):** `storybook`, `@storybook/{nextjs-vite,addon-docs,addon-a11y}`, `@tailwindcss/vite`, `eslint-plugin-storybook`

**Optional integrations** (KHÔNG cài sẵn; chỉ thêm khi có nhu cầu cụ thể):

| Integration    | Khi nào thêm                                                                           | Gợi ý                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Authentication | Trước khi deploy công khai ở REST mode (SEC-1)                                         | Chọn theo cơ chế của backend: OIDC → Auth.js hoặc SDK của IdP; session do backend cấp → tự viết `src/lib/auth.ts` |
| TanStack Query | Polling, infinite scroll, autocomplete, hoặc nhiều component client dùng chung dữ liệu | Xem `docs/api-integration.md` mục 7                                                                               |
| Zustand        | Có state client thật sự chia sẻ giữa nhiều nhánh UI (ví dụ wizard nhiều bước, builder) | Ưu tiên URL state và context trước                                                                                |
| Chart          | Dashboard cần biểu đồ                                                                  | Nên chọn thư viện chạy được với Server Component hoặc lazy-load phía client                                       |
| Date utility   | Cần múi giờ hoặc tính toán ngày phức tạp                                               | `Intl` đủ cho việc hiển thị                                                                                       |
| i18n           | Cần nhiều ngôn ngữ                                                                     | Xem `02-guides/internationalization.md`                                                                           |
| Monitoring     | Production                                                                             | Gắn vào `instrumentation.ts` (`onRequestError`) và các error boundary                                             |

## 9. Prioritized Changes

| Mức | ID    | Thay đổi                                                                                                                                                                                                                                                              | Trạng thái                                                                                          |
| --- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| P0  |       | Không có                                                                                                                                                                                                                                                              |                                                                                                     |
| P1  |       | Không có                                                                                                                                                                                                                                                              |                                                                                                     |
| P2  | DEP-1 | `engines.node` khai báo `>=22`, trong khi tool thật sự yêu cầu `^22.22.2 \|\| ^24.15.0 \|\| >=26`. Hậu quả: Node 22.0–22.22.1 và Node 24.0–24.14 vẫn qua được kiểm tra `engines`, nhưng nằm ngoài range mà jsdom/lint-staged hỗ trợ; Node 25 không được Vitest hỗ trợ | **Đã sửa**, thêm `.nvmrc` và CI dùng `node-version-file`                                            |
| P2  | DEP-2 | ESLint 9 bị đánh dấu deprecated; chưa nâng được                                                                                                                                                                                                                       | Theo dõi `eslint-config-next`; nâng khi plugin hỗ trợ ESLint 10                                     |
| P3  | DEP-3 | Range Tailwind không đồng nhất (`^4` và `^4.3.3`); các package Tailwind phải luôn cùng version                                                                                                                                                                        | **Đã sửa** (`^4.3.3` cho cả 3)                                                                      |
| P3  | DEP-4 | Patch `react`/`react-dom` 19.3.0 → 19.3.1                                                                                                                                                                                                                             | **Đã áp dụng**, toàn bộ kiểm tra pass                                                               |
| P3  | SEC-6 | Theo dõi GHSA-vfj7-8cjw-p6xm                                                                                                                                                                                                                                          | Monitor                                                                                             |
| P3  | DEP-5 | Storybook chiếm 39% cây dependency. Cân nhắc tách thành tính năng tùy chọn                                                                                                                                                                                            | **Chưa làm**, cần quyết định (mục 10)                                                               |
| P3  | DEP-6 | Rác `eslint@10` trong `node_modules/.pnpm` trên máy local                                                                                                                                                                                                             | Tùy chọn: xóa `node_modules` rồi `pnpm install`                                                     |
| P3  | DEP-7 | Major mới đã có: TypeScript 7, `@types/node` 26                                                                                                                                                                                                                       | Không nâng: TS bị chặn bởi `typescript-eslint <6.1`; `@types/node` nên khớp với Node trong `.nvmrc` |

## 10. Migration Plan (cho các thay đổi lớn, chưa thực hiện)

### DEP-5: tách Storybook thành tùy chọn (chỉ làm khi team không dùng Storybook)

- **Package bị ảnh hưởng:** `storybook`, `@storybook/nextjs-vite`, `@storybook/addon-docs`, `@storybook/addon-a11y`, `@tailwindcss/vite`, `eslint-plugin-storybook`.
- **File bị ảnh hưởng:** `.storybook/`, `src/**/*.stories.tsx` (12 file), `eslint.config.mjs` (`storybook.configs`), `package.json` (scripts `storybook`, `build-storybook`), `.github/workflows/ci.yml` (bước `build-storybook`), `docs/component-guidelines.md` mục 7, README.

Các bước:

1. `pnpm remove storybook @storybook/nextjs-vite @storybook/addon-docs @storybook/addon-a11y @tailwindcss/vite eslint-plugin-storybook`
2. Xóa `.storybook/` và các file `*.stories.tsx`; bỏ `storybook.configs` khỏi ESLint config; bỏ bước build Storybook trong CI.
3. Ghi vào `docs/` cách cài lại bằng `pnpm dlx storybook@<version> init` (có thể giữ nhánh `with-storybook`).
4. Kiểm tra: `pnpm check && pnpm build && pnpm test:e2e`; `pnpm list --depth Infinity` sẽ giảm khoảng 279 package.

**Đánh đổi:**

- Mất nơi phát triển và xem component độc lập.
- Mất addon a11y.
- Mất bản xem trước Template.

Với một template theo hướng design system, **khuyến nghị giữ Storybook**.

### DEP-2: nâng ESLint 10 (khi đủ điều kiện)

1. Theo dõi: `npm view eslint-config-next@latest dependencies` và peer dependency của `eslint-plugin-react`, `eslint-plugin-jsx-a11y`, `eslint-plugin-import`.
2. Khi tất cả hỗ trợ ESLint 10: `pnpm add -D eslint@^10 eslint-config-next@<bản mới>`, rồi chạy `pnpm peers check`, `pnpm lint`, và kiểm tra boundary rule bằng một import vi phạm có chủ đích.

## 11. Changes Applied

| File                       | Thay đổi                                                                    | Lý do                                         |
| -------------------------- | --------------------------------------------------------------------------- | --------------------------------------------- |
| `package.json`             | `react`, `react-dom`: `19.3.0` → `19.3.1`                                   | DEP-4 (patch)                                 |
| `package.json`             | `tailwindcss`, `@tailwindcss/turbopack`: `^4` → `^4.3.3`                    | DEP-3                                         |
| `package.json`             | `engines.node`: `>=22` → `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`             | DEP-1                                         |
| `.nvmrc` (mới)             | `24`                                                                        | DEP-1: một nguồn version Node cho local và CI |
| `.github/workflows/ci.yml` | `node-version: 24` → `node-version-file: .nvmrc` (2 job)                    | DEP-1                                         |
| `README.md`                | Cập nhật yêu cầu Node                                                       | DEP-1                                         |
| `pnpm-lock.yaml`           | Cập nhật bởi `pnpm install` (chỉ thay đổi react/react-dom và các specifier) |                                               |

Không xóa package nào. Không thêm override nào. Không nâng major nào.

## 12. Verification Results

Tất cả lệnh dưới đây **đã chạy thật**, sau khi áp dụng thay đổi:

| Lệnh                                              | Kết quả                                               |
| ------------------------------------------------- | ----------------------------------------------------- |
| `pnpm install` / `pnpm install --frozen-lockfile` | OK / "Lockfile is up to date"                         |
| `pnpm peers check`                                | No peer dependency issues found                       |
| `pnpm typecheck`                                  | Pass                                                  |
| `pnpm lint`                                       | Pass                                                  |
| `pnpm format:check`                               | Pass                                                  |
| `pnpm test`                                       | 61/61 pass (12 file)                                  |
| `pnpm build`                                      | Pass; `/dashboard`, `/tasks` là `◐` Partial Prerender |
| `CI=1 pnpm test:e2e`                              | 7/7 pass                                              |
| `pnpm build-storybook`                            | Pass                                                  |
| `pnpm audit --prod`                               | No known vulnerabilities found                        |
| `pnpm audit`                                      | 1 high (SEC-6, dev-only, không có bản vá)             |
| `pnpm dlx knip@6.42.0`                            | Không có dependency thừa hay thiếu                    |
| `pnpm next analyze --output`                      | Đã chạy; kết quả nằm ở `.next/diagnostics/analyze`    |

**Chưa kiểm chứng:**

- CI trên GitHub (repo chưa được push).
- Chưa rõ React 19.3.1 có sửa lỗi bảo mật nào không.
- Chưa có số đo trực tiếp phần Zod trong chunk `/tasks` (mới là ước tính).
- Chưa xác định key cấu hình của pnpm 12 để bỏ qua advisory mà không cần dùng cờ CLI.

## Trả lời các câu hỏi cuối

1. **Dependency có phù hợp không?** Có. Dependency runtime gọn, mỗi package đều có lý do tồn tại.
2. **Dependency thiết yếu:** `next`, `react`, `react-dom`, `zod`, `server-only`, `class-variance-authority`, `clsx`, `tailwind-merge`, `lucide-react`.
3. **Thừa hoặc trùng lặp:** không có. Package có chi phí bảo trì lớn nhất là Storybook (tùy chọn, nên giữ).
4. **Version có tương thích không?** Có. Đã sửa engines Node và range Tailwind. ESLint 10, TypeScript 6/7 bị chặn bởi upstream.
5. **SEC-6 còn không?** Còn, chưa có bản vá. Lỗ hổng chỉ ở dev tool và không được gọi tới trong repo, nên chỉ cần theo dõi.
6. **Baseline tối thiểu:** 9 core dependency + 2 package form, cùng bộ dev tool ở mục 8.
7. **Nên để tùy chọn:** auth, TanStack Query, Zustand, chart, date, i18n, monitoring, và (nếu team muốn) Storybook.
8. **Sẵn sàng làm template lâu dài chưa?** Về mặt dependency thì có. Điều kiện còn lại không thuộc dependency: auth (SEC-1) và cho CI chạy xanh trên GitHub.
