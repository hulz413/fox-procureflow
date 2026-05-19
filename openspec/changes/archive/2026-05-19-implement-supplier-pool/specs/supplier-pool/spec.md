## ADDED Requirements

### Requirement: Supplier pool is available as a first-class workspace page
The system SHALL provide a dedicated supplier pool page in the procurement workspace so users can directly inspect the group shared supplier pool without entering the broader master data verification page.

#### Scenario: Open supplier pool from sidebar
- **WHEN** a user clicks the sidebar supplier pool navigation item
- **THEN** the frontend MUST navigate to `/suppliers`
- **AND** the supplier pool navigation item MUST show the active route state
- **AND** the page MUST render a supplier pool workspace rather than the dashboard or generic master data page

#### Scenario: Open supplier pool route directly
- **WHEN** a user opens `/suppliers` directly in the browser
- **THEN** the frontend MUST render the supplier pool workspace
- **AND** it MUST keep the existing Fox Procureflow workspace shell, sidebar, topbar, and visual baseline

### Requirement: Supplier pool page uses backend master data
The supplier pool page SHALL load supplier and category data from backend master data APIs and SHALL NOT use static frontend mock data to hide empty or unavailable backend responses.

#### Scenario: Display roadmap supplier pool
- **WHEN** the backend master data APIs return the seeded supplier pool
- **THEN** the page MUST display the roadmap suppliers 上海云舟信息技术有限公司, 深圳蓝芯电子科技有限公司, 苏州恒润工业设备有限公司, 杭州诚采办公用品有限公司, and 宁波安捷物流有限公司
- **AND** each visible supplier row MUST include supplier name, service scope, location, risk level, status, and covered procurement categories

#### Scenario: Backend supplier data unavailable
- **WHEN** the supplier master data request fails or returns no records
- **THEN** the page MUST show a loading, error, or empty state that reflects the backend result
- **AND** it MUST NOT fill the list with frontend-only demo suppliers

### Requirement: Supplier pool can be filtered without changing data ownership
The supplier pool page SHALL allow users to filter the group shared supplier pool by practical inspection criteria while preserving the fact that suppliers are group-level reference data.

#### Scenario: Filter by procurement category
- **WHEN** a user selects a procurement category filter such as IT equipment or logistics services
- **THEN** the supplier list MUST show only suppliers whose backend category coverage includes the selected category
- **AND** clearing the filter MUST restore the full group shared supplier pool

#### Scenario: Filter by risk status and keyword
- **WHEN** a user enters a keyword and selects risk level or supplier status filters
- **THEN** the supplier list MUST update to rows matching all active filters
- **AND** the filter result MUST be derived from backend supplier fields including supplier name, service scope, location, risk level, status, and categories

#### Scenario: Switch company context while viewing suppliers
- **WHEN** a user switches between 星河数字科技有限公司 and 星河智能制造有限公司 context on the supplier pool page
- **THEN** the visible supplier pool MUST remain the same group-level supplier pool
- **AND** the page MUST make clear that company-scoped procurement records remain isolated while suppliers are shared reference data

### Requirement: Supplier detail drawer remains read-only
The supplier pool page SHALL provide a read-only supplier detail drawer for inspection and SHALL NOT expose write or procurement transaction actions from the supplier pool page.

#### Scenario: Open supplier detail drawer
- **WHEN** a user opens a supplier from the supplier pool list
- **THEN** the drawer MUST display the supplier name, service scope, location, risk level, status, shared scope, and covered procurement categories
- **AND** it MUST display the group shared supplier pool boundary and company procurement data isolation boundary

#### Scenario: Supplier detail has no mutating actions
- **WHEN** a user inspects the supplier list or supplier detail drawer
- **THEN** the page MUST NOT present create, edit, delete, approval, RFQ creation, PO creation, receipt, invoice, matching, upload, or download actions
- **AND** no supplier pool interaction from this page MUST mutate supplier master data or procurement transaction state
