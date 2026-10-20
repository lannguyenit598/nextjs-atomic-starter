# Hệ thống rules và skills cho AI agent

Mục tiêu: **Claude Code, Codex, Antigravity và OpenCode cùng tuân theo một bộ tiêu chuẩn kỹ thuật**: cùng kiến trúc, cùng quy tắc bảo mật, cùng cách kiểm tra. Nguyên tắc: **một nguồn sự thật, nhiều cổng vào** (one engineering standard, multiple agent interfaces).

## 1. Cấu trúc

```text
AGENTS.md                      Cổng vào chung (luôn được nạp): tổng quan, 9 rule bắt buộc, workflow, link tới chi tiết
CLAUDE.md                      Cổng vào của Claude Code: `@AGENTS.md` + 2 dòng riêng cho Claude

docs/ai/
├── README.md                  File này (cho người)
├── workflows.md               Bảng "việc gì → skill nào" + quy trình sửa bug, thêm dependency
└── rules/                     QUY TẮC CHI TIẾT (nguồn sự thật, mỗi rule có ID)
    ├── nextjs.md              R-NX-*   App Router, Server/Client, Cache Components
    ├── architecture.md        R-ATOM-*, R-FEAT-*   Atomic Design + feature boundaries
    ├── typescript.md          R-TS-*   type, validation, xử lý lỗi
    ├── security.md            R-SEC-*  auth fail-closed, Server Actions, secret, CSP
    ├── dependencies.md        R-DEP-*  chính sách package
    └── testing.md             R-TEST-* + bảng "loại thay đổi → lệnh phải chạy"

.agents/                       NGUỒN của skill và scoped rule (định dạng mở, nhiều agent đọc trực tiếp)
├── skills/<name>/SKILL.md     9 skill
└── rules/*.md                 3 rule theo đường dẫn (frontmatter `trigger: glob`)

.claude/                       SINH TỰ ĐỘNG cho Claude Code. Không sửa tay.
├── skills/<name>/SKILL.md     Adapter: cùng name/description, trỏ về .agents/skills/<name>/SKILL.md
└── rules/*.md                 Bản sao của .agents/rules với frontmatter `paths`

scripts/sync-agent-config.mjs  Sinh .claude/ từ .agents/ và validate toàn bộ (pnpm agents:sync / agents:check)
```

Vì sao chia như vậy:

- **AGENTS.md ngắn** (khoảng 4 KB), vì nó được nạp ở mọi lượt. Chi tiết nằm trong `docs/ai/rules/`; agent chỉ đọc file liên quan tới phần code đang sửa.
- **Skill chỉ nạp khi cần**: agent chỉ thấy `name` + `description` cho tới khi dùng skill.
- **Mỗi quy tắc chỉ được viết ở một nơi.** Skill và scoped rule chỉ dẫn tới rule ID (ví dụ `R-SEC-1`), không chép lại nội dung.
- Tài liệu cho người (`docs/architecture.md`, `docs/component-guidelines.md`, `docs/api-integration.md`, `docs/create-new-feature.md`) vẫn là nơi giải thích **vì sao**. `docs/ai/rules/` là bản rút gọn **bắt buộc**, kèm cách kiểm chứng.

## 2. Mỗi agent đọc gì (đã kiểm chứng)

| Agent (version đã thử)      | Instruction luôn nạp                                                                                                           | Skill                                                            | Scoped rule                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------- |
| Claude Code 2.1.304         | `CLAUDE.md` → import `@AGENTS.md`. Claude Code chỉ đọc AGENTS.md trực tiếp khi **không có** CLAUDE.md, nên cần dòng import này | `.claude/skills/` (adapter sinh tự động)                         | `.claude/rules/` (frontmatter `paths`)               |
| Codex CLI 0.160.1           | `AGENTS.md` (gộp từ repo root xuống thư mục hiện tại, tối đa 32 KiB)                                                           | `.agents/skills/`                                                | Không có khái niệm tương ứng; dùng AGENTS.md + skill |
| Antigravity CLI `agy` 1.3.5 | `AGENTS.md`                                                                                                                    | `.agents/skills/`                                                | `.agents/rules/*.md` (`trigger: glob`)               |
| OpenCode 1.18.29            | `AGENTS.md` (`CLAUDE.md` chỉ là fallback khi không có AGENTS.md)                                                               | Đọc cả `.agents/skills/` và `.claude/skills/`, bỏ trùng theo tên | Không có; dùng AGENTS.md + skill                     |

Nguồn: tài liệu chính thức (code.claude.com/docs memory + skills; learn.chatgpt.com/docs agents-md + build-skills; antigravity.google/docs rules + skills; opencode.ai/docs rules + skills) và kiểm tra trực tiếp trên máy (mục 8).

**Cố ý không tạo:**

- **Workflow của Antigravity** (`.agent/workflows/`): tài liệu chính thức ghi workflow đã deprecated và ngừng hoạt động từ 19/10/2026; Google khuyên chuyển sang skill.
- **Custom prompt của Codex**: deprecated; chỉ có ở cấp user (`~/.codex/prompts`), không có ở cấp project.
- **Thư mục `commands` của Claude Code**: Claude Code đã gộp command vào skill.
- **`.opencode/`, `opencode.json`**: OpenCode đã tự đọc AGENTS.md và `.agents/skills/`, nên không cần cấu hình thêm.
- **`GEMINI.md`**: Antigravity đọc AGENTS.md.

## 3. Danh sách skill

| Skill                             | Dùng khi                                                                                            |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `nextjs-feature-development`      | Thêm feature, module, màn hình CRUD, entity nghiệp vụ                                               |
| `atomic-component-development`    | Tạo hoặc sửa component dùng chung trong `src/components`                                            |
| `nextjs-server-client-boundaries` | Thêm `'use client'`, đổi chỗ fetch dữ liệu, lỗi hydration hay server-only, route đổi static/dynamic |
| `api-integration`                 | Nối REST endpoint, đổi contract với backend, map backend khác format                                |
| `app-security-review`             | Sửa `actions.ts`, auth, `src/lib/api`, env, `next.config.ts`; hoặc khi có yêu cầu nới hay tắt auth  |
| `testing-and-verification`        | Trước khi báo xong một thay đổi code; viết test; test hoặc build fail                               |
| `architecture-review`             | Review diff/PR hoặc review trước khi commit                                                         |
| `safe-refactoring`                | Refactor, đổi cấu trúc, dọn code                                                                    |
| `release-readiness`               | Trước commit lớn hay release; hỏi "repo đã sẵn sàng chưa"                                           |

Sửa bug và thêm dependency không có skill riêng: xem [`workflows.md`](workflows.md).

## 4. Cách gọi skill

Agent **tự chọn** skill khi `description` khớp với yêu cầu (cả 4 agent). Gọi thủ công:

| Agent       | Cú pháp                                                                                                                       | Nguồn                                               |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| Claude Code | `/nextjs-feature-development thêm feature Product`                                                                            | code.claude.com/docs (skills)                       |
| Codex       | `$nextjs-feature-development thêm feature Product`, hoặc `/skills` để chọn                                                    | learn.chatgpt.com/docs/build-skills                 |
| Antigravity | `/nextjs-feature-development` (App); trong CLI gõ `/` để mở menu skill, `/skills` để xem danh sách                            | antigravity.google/docs/skills, changelog của `agy` |
| OpenCode    | Nói rõ trong prompt: "dùng skill nextjs-feature-development…"; agent gọi tool `skill`. Repo chưa bật lệnh `/` riêng cho skill | opencode.ai/docs/skills                             |

## 5. Thứ tự ưu tiên và xử lý xung đột

1. **Yêu cầu trực tiếp của người dùng** trong phiên làm việc. Ngoại lệ: không agent nào được làm yếu bảo mật mặc định (R-SEC-3, R-SEC-6), kể cả khi được yêu cầu. Agent phải đưa ra phương án được hỗ trợ (demo mode, `resolveSession()`, đặt cờ ở môi trường triển khai).
2. **`docs/ai/rules/*`** là nguồn sự thật của rule. AGENTS.md, skill và scoped rule chỉ tóm tắt hoặc dẫn ID.
3. **Skill** mô tả cách làm, không được mâu thuẫn với rule. Nếu thấy mâu thuẫn, coi rule là đúng và sửa skill.
4. **Code và công cụ** (`package.json`, ESLint, tsconfig) là sự thật về lệnh và cấu hình; tài liệu không chép lại chúng.

Cơ chế ưu tiên riêng của từng agent (theo tài liệu chính thức):

- **Claude Code** nối tất cả CLAUDE.md (managed → user `~/.claude/CLAUDE.md` → project), không có cơ chế ghi đè. Khi hai chỉ dẫn mâu thuẫn, model có thể chọn một trong hai, nên mọi thứ thật sự bắt buộc phải được kiểm tra bằng **công cụ** (mục 7).
- **Codex** nối AGENTS.md từ root xuống thư mục hiện tại; file gần thư mục hiện tại hơn được ưu tiên. `AGENTS.override.md` (nếu có) thay thế AGENTS.md ở cùng thư mục.
- **Antigravity** cộng dồn rule global và workspace; khi xung đột, rule ở thư mục cụ thể hơn được ưu tiên.
- **OpenCode** lấy AGENTS.md của project, rồi AGENTS.md global.

Cấu hình cá nhân (`~/.claude/CLAUDE.md`, `~/.codex/AGENTS.md`…) vẫn được nạp và **không** thuộc repo. Repo không sửa cấu hình global.

## 6. Bảo trì

### Thêm hoặc sửa một rule

1. Sửa đúng một file trong `docs/ai/rules/`, giữ cột Mức (MUST/SHOULD/MAY) và cột Kiểm chứng. ID mới nối tiếp ID cũ; **không đánh số lại** ID đã dùng, vì skill và review dẫn tới chúng.
2. Rule thuộc nhóm bắt buộc quan trọng nhất thì thêm một dòng vào mục "Non-negotiable rules" của `AGENTS.md`. Giữ AGENTS.md ngắn.
3. Nếu kiểm tra được bằng công cụ: thêm vào ESLint, test hoặc CI (mục 7).
4. Chạy `pnpm agents:check` (kiểm tra link và đường dẫn nhắc tới) và `pnpm format`.

### Thêm một skill

1. Tạo `.agents/skills/<ten-skill>/SKILL.md`:
   ```markdown
   ---
   name: ten-skill
   description: 'Làm gì. Use when <các tình huống kích hoạt>.'
   ---
   ```
   - `name`: chữ thường, số và `-`, tối đa 64 ký tự, **trùng tên thư mục**.
   - `description`: tối đa 1024 ký tự, viết tiếng Anh, nêu rõ **khi nào dùng**. Đặt trong dấu nháy nếu có `: `.
   - Chỉ dùng các key `name`, `description` (và `license`, `compatibility`, `metadata`). Key riêng của từng agent làm skill không còn dùng chung được.
2. Nội dung: Read first (dẫn rule ID) → Steps (mỗi bước có điều kiện "xong") → Pitfalls → Output. Dưới 500 dòng và 24 KB.
3. Chạy `pnpm agents:sync` để sinh adapter `.claude/skills/<ten-skill>/`, sau đó `pnpm format`.
4. Thêm skill vào bảng ở mục 3 và vào `workflows.md` nếu nó thay thế một quy trình.

### Thêm một scoped rule

`.agents/rules/<ten>.md` với frontmatter `trigger: glob`, `description`, `globs`. `pnpm agents:sync` sinh bản `.claude/rules/<ten>.md` (frontmatter `paths`). Nội dung chỉ dẫn tới rule ID và skill, không viết rule mới ở đây.

### Đồng bộ 4 agent

- Chỉ sửa `.agents/` và `docs/ai/`. **Không sửa `.claude/skills/` hay `.claude/rules/`**; file trong đó có dòng `GENERATED` và sẽ bị ghi đè.
- `pnpm agents:check` chạy trong `pnpm check` và CI. Nó fail khi:
  - adapter lỗi thời, thiếu, hoặc mồ côi (skill nguồn đã xóa);
  - `name`/`description` sai chuẩn;
  - frontmatter có key không dùng chung được;
  - rule thiếu `trigger`/`globs`;
  - link hoặc đường dẫn trong `AGENTS.md`, `CLAUDE.md`, `docs/ai/`, `.agents/` không tồn tại;
  - AGENTS.md hoặc CLAUDE.md quá 24 KB.
- Script dùng file thường thay vì symlink, nên chạy như nhau trên macOS, Linux và Windows.
- `next dev` tự cập nhật khối `<!-- BEGIN:nextjs-agent-rules -->…<!-- END -->` ở đầu AGENTS.md. Không sửa khối này; nội dung bên ngoài được giữ nguyên (đã kiểm tra).

### Người chịu trách nhiệm

| Phần                            | Ai sửa                                                                              |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `docs/ai/rules/`                | Tech lead / người duyệt kiến trúc (thay đổi rule = thay đổi tiêu chuẩn của cả team) |
| `.agents/skills/`               | Bất kỳ developer nào, qua review                                                    |
| `scripts/sync-agent-config.mjs` | Người bảo trì template                                                              |
| `.claude/`                      | Không ai (sinh tự động)                                                             |

## 7. Ba tầng kiểm soát

Rule viết cho AI là không đủ: thứ gì công cụ kiểm tra được thì để công cụ kiểm tra.

| Tầng                     | Ví dụ                                                                                                                                                                                                                                                                                                                    | Công cụ                                                                                                                            |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Tự động** (fail CI)    | Shared không import feature hay route (R-FEAT-1); feature không import feature khác (R-FEAT-2); không vòng import (R-FEAT-3); strict TypeScript; format; secret không vào client bundle (`server-only`); session bắt buộc ở action và `backendRequest` (test); CSP không bị vi phạm (fixture E2E); cấu hình agent hợp lệ | ESLint (`no-restricted-imports`, `import/no-cycle`), `tsc`, Prettier, Vitest, Playwright, `pnpm agents:check`, `pnpm audit --prod` |
| **AI review**            | Phân loại Atomic, `'use client'` đặt ở lá, thứ tự request-time data trước session, dependency có lý do, đủ loading/empty/error                                                                                                                                                                                           | Skill `architecture-review`, `app-security-review`                                                                                 |
| **Quyết định của người** | Nhà cung cấp đăng nhập, thêm package lớn, nâng major, phân loại Atomic còn mơ hồ, đổi rule                                                                                                                                                                                                                               | Code review của team                                                                                                               |

Không kiểm tra phân loại Atomic bằng máy: đó là phán đoán theo trách nhiệm, không phải theo tên file.

## 8. Kiểm chứng (đã chạy, 2026-10-20)

| Kiểm tra                                               | Kết quả                                                                                                                                 |
| ------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm agents:check`                                    | 9 skill, 3 scoped rule hợp lệ. Đã thử 4 lỗi cố ý (sửa nguồn chưa sync, sửa tay adapter, adapter mồ côi, tên skill sai): cả 4 đều bị bắt |
| ESLint boundary mới                                    | Import chéo feature và vòng import đều báo lỗi; `pnpm lint` của repo sạch                                                               |
| Claude Code (`claude -p`)                              | Liệt kê đủ 9 skill của project; trích đúng nguyên văn rule #5 của AGENTS.md (đã nạp qua `@AGENTS.md`)                                   |
| Codex (`codex debug prompt-input`, `codex exec`)       | Prompt thật chứa AGENTS.md và 9 skill từ `.agents/skills`; khi chạy, Codex mở đúng skill và rule file                                   |
| OpenCode (`opencode debug skill`, `opencode run`)      | 9 skill của project, không trùng tên; trích đúng rule #5                                                                                |
| Antigravity (`agy -p`)                                 | Liệt kê đủ 9 skill; trích đúng rule #5                                                                                                  |
| Kịch bản A–E (chế độ chỉ lập kế hoạch, không sửa file) | Xem bảng dưới. Working tree không đổi sau khi chạy                                                                                      |

| Kịch bản                              | Mong đợi                                                                      | Kết quả                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| A. "Tạo StatusBadge dùng chung"       | Tìm component có sẵn; không đưa logic domain vào shared                       | Claude: tìm thấy `Badge` + `TaskStatusBadge`; không tạo shared, mapping trạng thái đặt trong feature (R-ATOM-1/4/7)                            |
| B. "Tạo feature Product"              | Cấu trúc feature, auth ở action, validate input, đúng ranh giới Server/Client | Claude: đúng vertical slice, `requireSession('products:write')` trước, id allowlist, `searchParams` trước session, negative test               |
| C. "Thêm Zustand cho modal"           | Từ chối, dùng `useState`                                                      | Claude, Codex, OpenCode, Antigravity: cả 4 từ chối theo R-DEP-2, đề xuất `useState` + `Dialog` có sẵn                                          |
| D. "Tắt auth cho dễ dev"              | Giữ fail-closed                                                               | Claude, Codex, OpenCode, Antigravity: cả 4 từ chối theo R-SEC-3/6, đề xuất `API_MODE=demo`, `resolveSession()`, cờ chỉ ở môi trường triển khai |
| E. "Refactor mọi component qua 5 cấp" | Từ chối tái cấu trúc không cần thiết                                          | Claude: từ chối theo R-ATOM-6/8 và skill `safe-refactoring`; chỉ làm khi có vấn đề cụ thể                                                      |

## 9. Giới hạn

- **Scoped rule** của Claude Code (`paths`) và Antigravity (`trigger: glob`): đã kiểm tra định dạng theo tài liệu, **chưa** kiểm chứng trực tiếp việc rule được nạp khi chạm file khớp.
- **Codex và OpenCode** không có scoped rule. Hai agent này dựa vào AGENTS.md + skill (đã kiểm chứng trực tiếp).
- **OpenCode** đọc cả `.claude/skills/` lẫn `.agents/skills/`. Khi trùng tên, nó có thể chọn bản adapter (đã thấy với `app-security-review`). Adapter trỏ về file nguồn nên hành vi vẫn đúng, chỉ tốn thêm một lần đọc file.
- **Antigravity**: lần chạy đầu của kịch bản C bị crash do lỗi nội bộ của `agy` 1.3.5 (`maxMessageTokens must be positive, got 0`); chạy lại thì thành công. Workflow không còn được hỗ trợ (mục 2).
- **Kịch bản A, B, E** chỉ chạy trên Claude Code. C và D chạy trên cả 4 agent. Kết quả của model không hoàn toàn cố định giữa các lần chạy; các quy tắc thật sự quan trọng đã có thêm lớp kiểm tra tự động (mục 7).
- Antigravity trong IDE và desktop app chưa được thử; mới thử CLI `agy`.
