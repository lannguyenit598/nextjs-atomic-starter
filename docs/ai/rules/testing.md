# Rules: Testing và verification (R-TEST)

Lệnh nằm trong `package.json` (`scripts`). Hướng dẫn chạy: README mục "Testing".

| ID       | Mức    | Quy tắc                                                                                                                                                                                                           | Lý do                                                      | Kiểm chứng |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| R-TEST-1 | MUST   | Chỉ báo "pass" cho lệnh **đã chạy thật** trong phiên làm việc, kèm kết quả. Lệnh không chạy được: ghi rõ lý do.                                                                                                   | Báo cáo sai còn tệ hơn không báo cáo.                      | `human`    |
| R-TEST-2 | MUST   | Chọn kiểm tra theo rủi ro (bảng dưới). Mọi thay đổi code tối thiểu chạy `pnpm check`.                                                                                                                             | Đủ chắc chắn, không lãng phí.                              | `ci`       |
| R-TEST-3 | MUST   | Test hành vi, không test chi tiết triển khai: query theo role/label (`getByRole`), không query theo class CSS.                                                                                                    | Test sống sót qua refactor và kiểm tra luôn accessibility. | `review`   |
| R-TEST-4 | MUST   | Sửa bug: viết test tái hiện (fail trước khi sửa) khi khả thi.                                                                                                                                                     | Chứng minh đã sửa đúng nguyên nhân.                        | `review`   |
| R-TEST-5 | MUST   | Async Server Component không render bằng RTL: test logic (schema, repository, action) bằng unit test, test cả trang bằng E2E. jsdom không có `<dialog>.showModal()` thật: hành vi focus kiểm tra bằng Playwright. | Giới hạn của môi trường test.                              | `review`   |
| R-TEST-6 | MUST   | E2E import `test`/`expect` từ `e2e/fixtures.ts` (tự fail khi có vi phạm CSP).                                                                                                                                     | Mọi luồng mới được kiểm tra với CSP.                       | `review`   |
| R-TEST-7 | SHOULD | Component shared mới có story (`*.stories.tsx`, `title: '<Cấp>/<Tên>'`).                                                                                                                                          | Storybook là nơi xem design system.                        | `review`   |

## Kiểm tra theo loại thay đổi

| Loại thay đổi                                           | Bắt buộc                                                                                                     | Thêm khi cần                  |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Chỉ tài liệu (`*.md`)                                   | `pnpm format:check`                                                                                          | Kiểm tra link                 |
| Agent rules/skills (`.agents/`, `.claude/`, `docs/ai/`) | `pnpm agents:check`, `pnpm format:check`                                                                     |                               |
| Component shared                                        | `pnpm check`, test component, story, `pnpm build-storybook`                                                  | E2E nếu ảnh hưởng luồng chính |
| Logic, schema, repository                               | `pnpm check` với unit test mới                                                                               |                               |
| Server Action / auth / security                         | `pnpm check` với negative test (R-SEC-11), `pnpm build`                                                      | `pnpm test:e2e`               |
| Route, page, layout, `next.config.ts`                   | `pnpm check`, `pnpm build` (xem cột `◐`/`ƒ`), `pnpm test:e2e`                                                |                               |
| Dependency                                              | Như trên + `pnpm install --frozen-lockfile`, `pnpm audit --prod`, `pnpm peers check`, `pnpm build-storybook` |                               |
| Trước commit/release                                    | Toàn bộ: `pnpm check && pnpm build && pnpm test:e2e && pnpm build-storybook`                                 |                               |
