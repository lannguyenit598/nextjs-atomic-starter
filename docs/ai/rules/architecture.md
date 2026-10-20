# Rules: Atomic Design và Feature-Based Architecture (R-ATOM, R-FEAT)

Giải thích đầy đủ (vì sao, ví dụ, sơ đồ): [`docs/architecture.md`](../../architecture.md) và [`docs/component-guidelines.md`](../../component-guidelines.md). File này chỉ chứa phần **bắt buộc**.

## Layer và chiều import

```text
app/         Routing + ghép trang      → được import: features, components, config, lib
features/X/  Nghiệp vụ của X            → được import: components, lib (và file trong chính X)
components/  Design system dùng chung   → được import: lib (và cấp Atomic thấp hơn)
lib/         Hạ tầng kỹ thuật           → không import app, features, components
config/      Cấu hình app (menu, site)  → được import: components (type), lib
```

## Atomic Design (R-ATOM)

Atomic Design là **mô hình tư duy để ghép UI**, không phải 5 tầng kỹ thuật bắt buộc.

| ID       | Mức    | Quy tắc                                                                                                                                                                                                                                         | Lý do                                             | Kiểm chứng                         |
| -------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ---------------------------------- |
| R-ATOM-1 | MUST   | Component có kiến thức nghiệp vụ (tên domain, Server Action, schema nghiệp vụ, nhãn nghiệp vụ) nằm trong `src/features/<f>/components/`. `src/components/` chỉ chứa UI không biết domain.                                                       | Design system dùng lại được ở mọi dự án.          | `lint` (chiều import), `review`    |
| R-ATOM-2 | MUST   | Phân loại theo **trách nhiệm**, không theo tên file hay số dòng: atom = phần tử đơn; molecule = vài atom làm **một** việc; organism = một khu vực của trang; template = khung bố cục có slot, không có dữ liệu thật.                            | Đúng định nghĩa của Brad Frost.                   | `review`                           |
| R-ATOM-3 | MUST   | Atomic **Page** = `app/**/page.tsx` (template + dữ liệu thật). Atomic **Template** (`src/components/templates/`) khác `layout.tsx`: template chỉ có slot; layout là cơ chế routing và lắp template. Không tạo thư mục `components/pages` riêng. | Không nhầm khái niệm thiết kế với cơ chế routing. | `review`                           |
| R-ATOM-4 | MUST   | Trước khi tạo component mới: tìm component có sẵn, thử composition (slot, render prop), thử thêm variant, thử element HTML native. Chỉ tạo mới khi các cách trên không đủ.                                                                      | Tránh trùng lặp và wrapper rỗng.                  | `review`                           |
| R-ATOM-5 | MUST   | Component shared: props có type đầy đủ, nhận `className` (merge bằng `cn()`), chỉ dùng token màu (`bg-primary`…), không hard-code màu; accessible (label/`aria-*`, bàn phím, `aria-invalid` khi lỗi).                                           | Nhất quán và dùng được với screen reader.         | `review`, `test` (query theo role) |
| R-ATOM-6 | SHOULD | Không ép mọi thứ đi qua đủ 5 cấp; feature dùng thẳng atom/organism khi hợp lý. Khi phân vân giữa hai cấp, chọn cấp thấp hơn.                                                                                                                    | Thêm tầng không thêm giá trị.                     | `review`                           |
| R-ATOM-7 | SHOULD | Không tạo component chỉ bọc một thẻ HTML với vài class cố định.                                                                                                                                                                                 | Wrapper rỗng là chi phí bảo trì.                  | `review`                           |
| R-ATOM-8 | MAY    | Phân loại có thể mơ hồ (ví dụ `Card`, `Dialog`). Chấp nhận nếu có lý do; không di chuyển file chỉ để "đúng sách".                                                                                                                               | Atomic Design "is not rigid dogma".               | `human`                            |

## Feature boundaries (R-FEAT)

| ID       | Mức    | Quy tắc                                                                                                                                                                               | Lý do                                                           | Kiểm chứng                       |
| -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- | -------------------------------- |
| R-FEAT-1 | MUST   | `src/components/**`, `src/lib/**`, `src/hooks/**` không import `@/features/*` hay `@/app/*`.                                                                                          | Shared không được phụ thuộc nghiệp vụ.                          | `lint` (`no-restricted-imports`) |
| R-FEAT-2 | MUST   | Một feature không import `@/features/*` (kể cả feature khác). Bên trong feature dùng import tương đối. Khi hai feature cần chung một thứ: đưa UI lên `components/`, logic lên `lib/`. | Feature xóa/thay được độc lập.                                  | `lint`                           |
| R-FEAT-3 | MUST   | Không có circular import.                                                                                                                                                             | Vòng import gây lỗi khởi tạo và khó hiểu luồng.                 | `lint` (`import/no-cycle`)       |
| R-FEAT-4 | MUST   | Truy cập dữ liệu chỉ qua repository của feature (`services/<f>-repository.ts`, chọn adapter theo `API_MODE`). Component không gọi `fetch` hay `backendRequest`.                       | Đổi demo ↔ REST không sửa UI.                                   | `review`                         |
| R-FEAT-5 | MUST   | Cấu trúc feature: `schemas.ts`, `types.ts`, `actions.ts`, `services/`, `components/` (thêm `constants.ts`, `hooks/` khi cần). Một file chỉ tách thành thư mục khi quá lớn.            | Mọi feature trông giống nhau.                                   | `review`                         |
| R-FEAT-6 | SHOULD | Không barrel file (`index.ts` re-export).                                                                                                                                             | Barrel kéo code server vào bundle client và dễ tạo vòng import. | `review`                         |
| R-FEAT-7 | SHOULD | Chỉ chuyển code từ feature lên shared khi **cả ba**: có ≥ 2 nơi dùng, bỏ được kiến thức domain, phần domain truyền vào được qua props/slot.                                           | Không trừu tượng hóa sớm.                                       | `review`, `human`                |
