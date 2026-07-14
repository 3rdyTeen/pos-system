# EDFlow POS

EDFlow POS is a modern, cloud-based Point of Sale (POS) web application designed to simplify business operations for retailers, restaurants, and small to medium-sized businesses. It provides fast and secure sales processing, real-time inventory management, customer and supplier tracking, sales reporting, and multi-user access—all through an intuitive, user-friendly interface. Built for efficiency and scalability, EDFlow POS helps businesses streamline daily operations, improve accuracy, and make data-driven decisions from anywhere with an internet connection.

## Stack

Backend:

* Laravel 12
* PHP 8.3+
* MySQL 8
* Laravel Sanctum
* Eloquent ORM

Frontend:

* React 19
* Inertia.js
* TypeScript
* TanStack Query
* Zustand
* Vite
* Tailwind CSS v4
* shadcn/ui

Development:

* Composer
* npm
* Git
* Laravel Pint
* ESLint
* Prettier
* Pest PHP

---

# Architecture

Request flow:

Browser → React → Inertia → Laravel Routes → Controllers → Services → Repositories → Models → Database

Rules:

* Business logic belongs in Services.
* Database access belongs in Repositories.
* Controllers coordinate requests and responses only.
* React handles presentation and client UI.
* Inertia handles routing, layouts, forms, authentication flow, and initial props.
* TanStack Query handles server state.

---

# Frontend Rules

React responsibilities:

* UI rendering
* User interaction
* Component state

React must not:

* Implement business logic.
* Duplicate backend validation.
* Manage server state manually.

Use Inertia for:

* Page rendering
* Navigation
* Layouts
* Authentication flow
* Forms
* Initial server props

Use TanStack Query for:

* API requests
* Server data caching
* Mutations
* Background refetching
* Pagination
* Infinite queries
* Optimistic updates
* Polling

Avoid:

* useEffect + fetch/axios for server data.
* Duplicating the same data in Inertia and TanStack Query.

---

# State Management

This project uses four state layers.

## Local State (React)

Use React state for:

* Component-only values
* Dialog visibility
* Temporary form state
* UI interactions
* Selected items

## Client State (Zustand)

Use Zustand for:

* Global client-side state
* Shared UI state
* Application preferences
* Persistent client settings
* Cross-component workflows

Examples:

* Sidebar state
* Theme settings
* Table preferences
* Wizard/multi-step flow state

Do not use Zustand for:

* API responses
* Server cache
* Backend authentication state
* Data managed by TanStack Query

## Server State (TanStack Query)

Use TanStack Query for:

* API resources
* Cached server data
* Queries
* Mutations
* Pagination
* Infinite scrolling
* Background synchronization

Do not copy TanStack Query data into Zustand unless there is a clear client-state requirement.

## Page State (Inertia)

Use Inertia for:

* Current page
* Navigation
* Shared props
* Flash messages
* Validation errors
* Initial server-rendered data

---

# Data Loading

Use Inertia props for:

* Authenticated user
* Page metadata
* Initial page state
* Static lookup data
* Form options

Use API endpoints + TanStack Query for:

* Dynamic resources
* Search
* Analytics
* Notifications
* Live dashboards
* Large tables
* Shared data

---

# Folder Structure

```text
resources/js
├── Components
├── Hooks
│   ├── queries
│   └── mutations
├── Stores
├── Lib
│   ├── api.ts
│   └── query-client.ts
├── Pages
├── Layouts
└── app.tsx
```

Prefer feature-based organization:

```text
hooks/
  users/
    useUsers.ts
    useCreateUser.ts
    useUpdateUser.ts

stores/
  sidebarStore.ts
  settingsStore.ts
```

---

# React Guidelines

Components:

* Small
* Reusable
* Single responsibility

Pages:

* Receive Inertia props.
* Compose components.
* Use query/mutation hooks.
* Avoid business logic.

Custom hooks:

* Encapsulate API calls.
* Manage queries and mutations.
* Handle cache invalidation.

Zustand stores:

* Contain client-only state.
* Keep actions close to state.
* Avoid storing server data.

---

# Performance

Prefer:

* Eager loading
* Pagination
* Database indexing
* Query caching
* Query invalidation

Avoid:

* N+1 queries
* Duplicate API requests
* Manual loading states
* Unnecessary re-renders
* Large client-side state objects

---

# Code Generation Rules

When generating code:

* Use TanStack Query for API/server data.
* Use Zustand only for client-side global state.
* Put API calls inside reusable hooks.
* Use typed query keys.
* Invalidate affected queries after mutations.
* Keep components presentation-focused.
* Use Inertia for routing, forms, and page props only.
* Keep business logic in Laravel Services.
* Keep database logic in Laravel Repositories.
