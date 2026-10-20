# Workflows theo loại công việc

Mỗi loại công việc có **một** nơi mô tả quy trình. Phần lớn nằm trong skill (`.agents/skills/`); file này chỉ chứa quy trình cho những việc chưa có skill riêng.

| Công việc                              | Quy trình                                                               |
| -------------------------------------- | ----------------------------------------------------------------------- |
| A. Thêm feature                        | Skill `nextjs-feature-development`                                      |
| B. Tạo UI component                    | Skill `atomic-component-development`                                    |
| C. Sửa bug                             | Mục C bên dưới                                                          |
| D. Review PR / review trước khi commit | Skill `architecture-review` (+ `app-security-review` cho file nhạy cảm) |
| E. Thêm dependency                     | Mục E bên dưới                                                          |
| Server/Client boundary, data fetching  | Skill `nextjs-server-client-boundaries`                                 |
| Nối REST backend                       | Skill `api-integration`                                                 |
| Refactor                               | Skill `safe-refactoring`                                                |
| Chọn và chạy kiểm tra                  | Skill `testing-and-verification`                                        |
| Commit lớn / release                   | Skill `release-readiness`                                               |

## C. Sửa bug

1. **Tái hiện**: viết bước tái hiện hoặc một test **fail** cho bug (R-TEST-4). Xong khi có một lệnh cho kết quả sai một cách ổn định.
2. **Tìm nguyên nhân gốc**: đọc toàn bộ luồng liên quan và tìm mọi nơi gọi hàm sắp sửa. Sửa ở nơi chung mà mọi caller đi qua, không vá riêng đường mà bug report nhắc tới.
3. **Sửa tập trung**: chỉ đổi những gì cần cho bug; không refactor hay "dọn dẹp" code không liên quan.
4. **Kiểm tra**: test tái hiện chuyển sang pass; chạy các lệnh theo bảng trong `docs/ai/rules/testing.md`.
5. **Báo cáo**: nguyên nhân gốc, file đã sửa, test mới, lệnh đã chạy và kết quả.

## E. Thêm dependency

1. **Nhu cầu thật**: mô tả bằng một câu vấn đề cần giải quyết. Nhu cầu chưa có (ví dụ "sau này có thể cần") thì dừng.
2. **Đi theo thứ tự R-DEP-1**: code có sẵn trong repo → API native → dependency đã cài → vài dòng code. Ví dụ: state của một modal → `useState`, không phải Zustand; gọi HTTP → `backendRequest`, không phải Axios.
3. **Tương thích**: kiểm tra `peerDependencies` (`npm view <pkg> peerDependencies`) với Next.js, React, TypeScript, Vite/Vitest đang dùng.
4. **Chi phí**: kích thước bundle phía client (đo, ví dụ `pnpm next analyze --output`), số package kéo theo, tình trạng bảo trì.
5. **Cài và khóa**: `pnpm add <pkg>` (hoặc `-D`), commit kèm `pnpm-lock.yaml`. Không dùng `npm`/`yarn`.
6. **Kiểm tra**: `pnpm install --frozen-lockfile`, `pnpm peers check`, `pnpm audit --prod`, `pnpm check`, `pnpm build`, `pnpm build-storybook`.
7. **Ghi lại**: lý do, phương án đã loại, số đo (R-DEP-4).
