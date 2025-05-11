# RebaTS Express adapter

<!-- prettier-ignore -->
> [!NOTE]
> If you haven't already, check out the documentation for the [core library](https://github.com/Laci556/RebaTS)
> to learn more about the RebaTS framework and setting up your first project.
> This guide assumes you have a basic understanding of RebaTS and its core concepts.

## Installation

You will need `express` version 4 or higher installed in your project, as well
as `@rebats/core` set up with your favorite ORM, then you can install the
`@rebats/express` package.

```bash
npm install @rebats/express
```

## Usage

Initialize the middleware with your RebaTS instance and pass it to the Express
app.

```typescript
import express from "express";
import { authClient } from "./your-auth-client";

const app = express();
app.use(rebatsMiddleware(authClient));

// ...
```

Add the `authorize` middleware to your routes to protect them. It's up to you to
authenticate your users, see the
[authentication vs. authorization](https://github.com/Laci556/RebaTS) section of
our docs for more information and recommendations. <!-- TODO: add docs link -->

```typescript
import { authorize } from "@rebats/express";

// Initialize your express app

app.get(
  "/protected/:id",
  authorize((req, res, applyAuth) =>
    applyAuth(
      // Assuming you have a userId on the request from a previous middleware
      sUser.select({ id: res.locals.userId }),
      // You can also use params, query, body, etc. just like you would in a route handler
      sProtectedSubject.someAction.select({
        id: req.params.id,
        status: req.query.status,
      }),
    ),
  ),
  (req, res) => {
    res.send("I'm protected!");
  },
);
```

If authorization fails, the error will be passed to the next error handler in
the chain where you can customize the response. See the
[Express docs](https://expressjs.com/en/guide/error-handling.html) on how to do
this.

## Advanced

For advanced usage, check out the [full documentation](https://rebats.dev).
