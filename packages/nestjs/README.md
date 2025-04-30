# RebaTS NestJS adapter

<!-- prettier-ignore -->
> [!NOTE]
> If you haven't already, check out the documentation for the [core library](https://github.com/Laci556/RebaTS)
> to learn more about the RebaTS framework and setting up your first project.
> This guide assumes you have a basic understanding of RebaTS and its core concepts.

## Installation

You will need a NestJS project (version 10 or newer) and `@rebats/core` set up
with your favorite ORM, then you can start by installing the `@rebats/nestjs`
package.

```bash
npm install @rebats/nestjs
```

## Usage

Initialize `RebaTSModule` in your `AppModule`:

```typescript
import { Module } from "@nestjs/common";
import { RebaTSModule } from "@rebats/nestjs";
import { yourAdapter } from "./path/to/your/adapter";

@Module({
  imports: [
    RebaTSModule.forRoot({
      adapter: yourAdapter,
    }),
  ],
})
export class AppModule {}
```

You can also initialize the module with `forRootAsync` to create a new adapter
using your database service inside Nest's DI. Here's how you'd do that with
`@rebats/drizzle`, the same concept applies to Prisma, too.

```typescript
import { Module } from "@nestjs/common";
import { RebaTSModule } from "@rebats/nestjs";
import { createAdapter } from "@rebats/drizzle";
import { DrizzleModule, DrizzleService } from "./path/to/drizzle";

@Module({
  imports: [
    DrizzleModule,
    RebaTSModule.forRootAsync({
      // Assuming your DrizzleService has a drizzle client
      useFactory: (drizzle: DrizzleService) => ({
        adapter: createAdapter(drizzle.client),
      }),
      imports: [DrizzleModule],
    }),
  ],
})
export class AppModule {}
```

Add the `Authorize` guard to your routes to protect them. It's up to you to
authenticate your users, see the
[authentication vs. authorization](https://github.com/Laci556/RebaTS) section of
our docs for more information and recommendations.

<!-- TODO: add docs link -->

```typescript
import { Authorize } from "@rebats/express";
import { Request, Response } from "express";

@Controller("protected")
export class ProtectedController {
  @Get(":id")
  @Authorize((req: Request, res: Response, applyAuth) =>
    applyAuth(
      // Assuming you have a userId on the request from a previous middleware or guard
      sUser.select({ id: res.locals.userId }),
      // You can also use params, query, body, etc. just like you would in a route handler
      sProtectedSubject.someAction.select({
        id: Number(req.params.id), // Make sure to validate and parse your data if needed
        status: req.query.status,
      }),
    ),
  )
  protectedRoute(@Param("id") id: string) {
    return "I'm protected!";
  }
}
```

If authorization fails, a customized HTTPException will be thrown with the
proper status code that you can handle in your exception filter.

## Advanced

For advanced usage, check out the
[full documentation](https://github.com/Laci556/RebaTS).

<!-- TODO: add docs -->
