---
"@rebats/drizzle": patch
"@rebats/prisma": patch
"@rebats/core": patch
"@rebats/express": patch
---

Added support for attributes

You can now use attributes when defining relations. Attributes are a way to add
additional checks on related subjects. For example, before, you would've defined
static attributes in a relation like this:

```ts
const sFoo = s.subject("foo").relation(
  "relatedUser",
  () => sUser,
  (user) => ({
    theRelatedUser: {
      $and: [
        user,
        {
          role: "admin",
          verified: true,
          status: { $in: ["active", "invited"] },
        },
      ],
    },
  }),
);
```

This can get tedious and unreadable quickly, especially if you have multiple
relations that require the same attributes. Now, you can define attributes on
the related subject and use them in the relation definition:

```ts
const sUser = s
  .subject("users")
  // You can define a static attibute flag
  .attribute("isVerified", () => ({ verified: true }))
  // Or a more flexible dynamic attribute
  .attribute("role", (role: string) => ({ role: role }))
  .attribute("statusIn", (statuses: string[]) => ({
    status: { $in: statuses },
  }));

const sFoo = s.subject("foo").relation(
  "relatedUser",
  () => sUser,
  (user) => ({
    // You can use any of the attributes defined on the related subject,
    // even multiple at once; they will be combined with $and
    theRelatedUser: user
      .with("isVerified")
      .with("role", "admin")
      .with("statusIn", ["active", "invited"]),
  }),
);
```
