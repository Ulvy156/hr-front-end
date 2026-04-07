# Frontend rules for this project (STRICT)

Before writing any code, follow these rules exactly.

1. Follow the Postman collection only
- Use the Postman collection as the source of truth for request, response, field names, and statuses
- Do not guess API shape
- Do not rename backend fields unless there is already an existing mapper pattern in the project
- Keep frontend behavior aligned with the actual API contract

2. Reuse existing code first
- Before creating anything new, check whether the project already has the same pattern in:
  - composables
  - Pinia stores
  - utils
  - shared components
  - table actions
  - form sections
  - filters
  - use veevalidate package to validate user input
- If it already exists, reuse or extend it
- Do not duplicate logic across pages or features

3. Keep business logic out of UI components
- Components should focus on rendering and user interaction only
- Move API calls, data transformation, permission logic, export logic, and formatting into composables, stores, or utils
- Do not make page components overly smart

4. Centralize auth and current user state
- Use the existing auth flow
- Get current user from /auth/me and store it centrally in Pinia
- Use that central user state for permission checks, role checks, route protection, and conditional rendering
- Do not refetch the current user in random pages unless there is a real reason

5. Enforce role and permission rules in the UI
- Hide or disable actions the user cannot access
- Do not show employee-only, HR-only, or admin-only features to the wrong role
- Admin, HR, and Employee UI must follow the project business rules already defined
- UI checks are required, but backend authorization must still be respected

6. Keep UI patterns consistent across the whole project
- Reuse the same card style, section spacing, form layout, filter layout, status badge style, and table pattern
- Do not introduce a new visual pattern when an existing one already works
- Keep the app visually consistent from page to page

7. Follow this project’s layout style
- Important sections should use full width
- Major sections should be stacked vertically, not squeezed side by side
- Inside a section/card, use structured grids for readability where appropriate
- Keep the UI optimized for laptop screen first
- Do not spend time on responsive/mobile work unless explicitly requested

8. Table rules
- Reuse the project’s existing table pattern
- Row actions should use a shared actions component or one consistent dropdown/action group pattern
- Do not scatter random action buttons across each row
- Each action should have a clear label, icon, and color meaning when the project already supports that pattern
- Show only useful columns; move heavy details into detail page or modal

9. Forms rules
- Match API fields exactly
- Reuse existing input, select, date, and validation patterns if they exist
- Show validation messages near the field
- Disable submit buttons while requests are in progress
- Do not create inconsistent form layouts between modules

10. Formatting rules
- Use shared formatting utilities for date, time, status, and display labels
- Time must be user-friendly, for example 1:00 PM instead of 13:00
- Do not implement different date/time formatting logic in different pages
- Centralize formatting logic in reusable utils if it does not already exist

11. Filter rules
- Use one clear filter state per page/feature
- Reuse filter patterns already used in the project
- Keep filter logic maintainable and predictable
- Do not create separate filter logic for table display and export unless absolutely necessary

12. Export rules
- Export must follow the same filters currently applied in the UI
- Reuse shared export logic if it exists
- Do not build isolated export behavior that ignores visible filters

13. Loading, empty, and error states are mandatory
- Every API-driven page must handle loading state
- Every API-driven page must handle empty state
- Every API-driven page must handle error state
- Do not leave blank spaces or broken UI while data is loading or missing
- Do not dump raw backend errors directly into the UI unless there is already a project pattern for it

14. Audit log UI rules
- Audit log details must be easy to scan
- Clearly show:
  - who performed the action
  - what action happened
  - what changed
  - when it happened
  - what record was affected
- Keep audit detail UI structured and clean, not noisy

15. Respect feature boundaries
- Attendance code stays inside attendance feature modules
- Leave code stays inside leave feature modules
- Employee code stays inside employee feature modules
- Shared code should stay generic
- Do not mix unrelated feature logic into one component, composable, or store

16. QR attendance UI rules
- Only HR and Employee can access scan attendance flow
- Admin must not see or use scan attendance UI
- Scan flow should support redirect-based auto check-in/check-out behavior according to current attendance state

17. Security rules for frontend
- Never rely only on hidden buttons for protection
- Do not expose sensitive data to roles that should not see it
- Keep token handling and auth-related logic centralized
- Reuse cookie/auth utilities already in the project
- Avoid hardcoding sensitive assumptions in the UI

18. Code quality rules
- Prefer small reusable components over giant page files
- Use clear naming for files, components, composables, stores, and utils
- Avoid magic strings and hardcoded role IDs if constants/enums already exist
- Keep conditions readable
- Extend existing patterns instead of creating one-off shortcuts

19. Performance rules
- Do not make unnecessary API calls
- Avoid duplicate requests for the same data on the same page
- Reuse centralized state when data already exists in Pinia, composables, or cache
- Debounce search and filter inputs when they trigger API requests
- Do not refetch whole pages after every small action unless necessary
- Prefer updating local state safely instead of always reloading everything
- Keep computed logic out of templates when it is expensive
- Avoid watchers that cause repeated API calls or unnecessary rerenders
- Lazy load heavy pages or modules if the project already supports that pattern
- Render heavy components only when they are actually needed
- Keep tables efficient, especially when handling large datasets
- Reuse shared formatters and mappers instead of recalculating the same thing in many places
- Scope detail/modal fetches only to the data actually needed
- Do not load hidden tabs or hidden sections eagerly unless required
- If a page needs to call multiple APIs at the same time, use Promise.all (or equivalent) to run them in parallel instead of sequential calls
- You must reuse existing reusable components in the project. 
If a similar component already exists, you must use or extend it. 
Creating a new component with overlapping functionality is considered incorrect.

20. Vue reactive function rules (ref vs reactive)
- Use ref for primitive values (string, number, boolean)
- Use reactive for objects with multiple related properties
- Do not wrap everything in reactive unnecessarily
- Prefer ref as default unless managing grouped object state
- Do not mix ref and reactive incorrectly (avoid nested reactive confusion)
- Always destructure reactive state carefully using toRefs or equivalent to avoid losing reactivity
- Do not create unnecessary reactive layers if data can stay static
- Keep state minimal and only reactive when needed
- Avoid deep nested reactive objects that are hard to track and debug

21. Advanced reactivity rules (shallowRef, etc.)
- Use shallowRef when storing large objects, API responses, or third-party data where deep reactivity is  not needed
- Prefer shallowRef for performance-sensitive data to avoid unnecessary deep tracking
- Do not use deep reactive structures for large datasets like tables or logs
- Use computed for derived state instead of manually syncing values
- Avoid overusing watchers; prefer computed or explicit function calls
- Use watch only when reacting to specific changes (e.g., trigger API on filter change)
- Do not use watchers for logic that can run directly in events or lifecycle hooks

## 22. UX rules (user experience)

- UI must be intuitive and require minimal user thinking
- Always prioritize clarity over clever design

### Interaction
- Every action must have clear feedback (loading, success, error)
- Buttons must clearly indicate their purpose
- Dangerous actions must be visually distinct (e.g. delete)

### User flow
- Avoid unnecessary steps for common actions
- Keep primary actions easy to access and visible
- Do not hide important actions inside deep menus unless necessary

### Feedback
- Show loading indicators immediately when action starts
- Show success/error feedback after actions complete
- Do not leave user unsure about system state

### Readability
- Important information must be easy to scan
- Use spacing and grouping to improve clarity
- Avoid dense or cluttered layouts

### Consistency
- Same action = same behavior across the app
- Same data = same format everywhere

### Error handling UX
- Show user-friendly error messages
- Do not expose raw backend errors unless needed
- Guide user on what to do next

### Performance UX
- Avoid blocking UI during background operations
- Use partial loading where possible instead of full reload

### UI styling rules (colors & backgrounds)

- Always prioritize project-defined custom CSS classes for colors, backgrounds, and design tokens
- Do not use arbitrary Tailwind color classes (e.g. bg-blue-500, text-red-600) if a custom class already exists
- Reuse existing project styles (e.g. .bg-primary, .text-muted, .card-bg, etc.) before using Tailwind utilities
- Tailwind should be used for layout, spacing, and structure, not for overriding the design system
- Do not introduce new colors or background styles unless they are added to the project’s design system
- Keep visual consistency across all pages by following existing color and styling patterns

# Final instruction:
Before implementing anything, first scan the existing project structure and find similar patterns to reuse. If a similar implementation already exists anywhere in the project, extend it instead of rebuilding it from scratch.