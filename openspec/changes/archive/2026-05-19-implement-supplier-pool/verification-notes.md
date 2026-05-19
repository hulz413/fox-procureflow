# Verification Notes

## Commands

- `PATH="/opt/homebrew/bin:$PATH" npm run build`
  - Result: frontend TypeScript and Vite production build passed.
  - Caveat: default `/Users/hulz/.local/bin/node` is Node `20.11.0`, which is too old for the current Vite toolchain; Homebrew Node `25.9.0` was placed first in `PATH`.
- `JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="$(brew --prefix openjdk@21)/bin:$PATH" ./gradlew test --tests com.foxprocureflow.identity.masterdata.MasterDataIntegrationTest`
  - Result: backend master data integration test passed.
- `PATH="/opt/homebrew/bin:$PATH" npm run lint`
  - Result: lint passed with 4 existing React hook dependency warnings in unrelated PO, matching, and receipt/invoice sections.
- `git diff --check`
  - Result: no whitespace errors.
- `openspec validate implement-supplier-pool`
  - Result: change is valid.
- `JAVA_HOME="$(brew --prefix openjdk@21)/libexec/openjdk.jdk/Contents/Home" PATH="/opt/homebrew/bin:$(brew --prefix openjdk@21)/bin:$PATH" ./scripts/launch.sh`
  - Result: local infrastructure, backend, and frontend started for browser verification.
- `PATH="/opt/homebrew/bin:$PATH" playwright-cli open http://localhost:5173/suppliers`
  - Result: supplier pool route rendered in the workspace shell.

## Browser Checks

- URL verified: `http://localhost:5173/suppliers`
- Sidebar “供应商池” navigates to `/suppliers` and shows the active supplier pool workspace instead of the dashboard or master data page.
- Initial backend data shows 5 suppliers:
  - 上海云舟信息技术有限公司
  - 深圳蓝芯电子科技有限公司
  - 苏州恒润工业设备有限公司
  - 杭州诚采办公用品有限公司
  - 宁波安捷物流有限公司
- Category filter `category-logistics-service` narrows the list to 宁波安捷物流有限公司 and displays `结果: 1/5`.
- Opening 宁波安捷物流有限公司 shows a read-only supplier detail drawer with service scope, location, risk, status, shared scope, covered category, and group/company boundary text.
- Clearing filters and switching from 星河数字科技有限公司 to 星河智能制造有限公司 keeps the supplier result at `5/5`, confirming the supplier pool remains group shared.
- `playwright-cli console error` returned 0 current console errors after replacing deprecated Drawer `width` with `size`.

## Environment Caveats

- The local stack is running with `./scripts/launch.sh`; frontend URL is `http://localhost:5173`, backend health URL is `http://localhost:8080/api/health`.
- Vite emits the existing large chunk warning during production build; this is unchanged by the supplier pool change.
