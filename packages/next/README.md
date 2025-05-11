# RebaTS Next.js adapter

<!-- prettier-ignore -->
> [!NOTE]
> If you haven't already, check out the documentation for the [core library](https://github.com/Laci556/RebaTS)
> to learn more about the RebaTS framework and setting up your first project.
> This guide assumes you have a basic understanding of RebaTS and its core concepts.

## Installation

You will need a Next.js project (Next.js 14+ with app router) with RebaTS `core`
installed. Add the RebaTS Next.js adapter to your project:

```bash
npm install @rebats/express
```

## Configuration

Initialize the library with your RebaTS database adapter. You will need to
configure the default components for the `protectedPage` wrapper. You can create
your own components or use Next's built-in functions e.g. `notFound()` or
`unauthorized()` to display an error message.

```tsx
// @/lib/rebats.ts

import { initRebaTS } from "@rebats/next";
import { adapter } from "./your-rebats-adapter";
import { notFound } from "next/navigation";

function NotFound() {
  // You can Next's built-in notFound() function
  // to redirect to a 404 page
  notFound();
  return null;
}

function Unauthorized() {
  // You can also use a custom component
  return <div>Unauthorized</div>;
}

function Unknown() {
  // Or throw an error to catch it in the closest error boundary
  // (although this is not recommended as the client-side error
  // component will not include the error message)
  throw new Error("Unknown error");
}

const { protectedPage, protectedRoute } = initRebaTS(adapter, {
  notFoundComponent: NotFound,
  unauthorizedComponent: Unauthorized,
  unknownComponent: Unknown,
  // ...
});
```

You can also configure the default route handlers for the `protectedRoute`
wrapper. By default, an authorization error in the route handler will send an
empty response with the corresponding status code.

```ts
const { protectedPage, protectedRoute } = initRebaTS(adapter, {
  // ...
  handleForbiddenError: (req) => {
    return new Response("Forbidden", { status: 403 });
  },
  // ...
});
```

## Usage

### In server components

Wrap your server component with the `protectedPage` wrapper. This will ensure
that it only renders for authorized users.

```tsx
// app/protected/page.tsx
import { protectedPage } from "@/lib/rebats";

function MyProtectedPage({ params }: { params: { id: string } }) {
  return <div>I'm protected! {params.id}</div>;
}

export default protectedPage(MyProtectedPage, async (props, applyAuth) => {
  // Get the user from your auth provider
  const userId = await getUserIdFromSession();

  return applyAuth(
    sUser.select({ id: userId }),
    // You can use the props to select the data you need
    sProtectedSubject.someAction.select({
      id: props.params.id,
    }),
  );
});
```

You can also wrap layouts with the `protectedPage` wrapper, as long as they are
server components.

### In route handlers

Wrap your route handler with the `protectedRoute` wrapper.

```ts
// app/api/protected/route.ts
import { protectedRoute } from "@/lib/rebats";

const handler = async (req: Request) => {
  return new Response("I'm protected!");
};

export const GET = protectedRoute(handler, async (req, applyAuth) => {
  // Get the user from your auth provider
  const userId = await getUserIdFromSession();

  return applyAuth(
    sUser.select({ id: userId }),
    // You can use the request to select the data you need
    sProtectedSubject.someAction.select({
      id: req.nextUrl.searchParams.get("id"),
    }),
    // You can override the config to handle errors differently
    // (this also works for the protectedPage wrapper)
    {
      handleForbiddenError: (req) => {
        return new Response("Custom Forbidden Error", { status: 403 });
      },
    },
  );
});
```

## Advanced

For advanced usage, check out the [full documentation](https://rebats.dev).
