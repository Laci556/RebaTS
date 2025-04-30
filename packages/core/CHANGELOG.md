# @rebats/core

## 0.0.17

### Patch Changes

- 06104be: Added error reason to AuthResult, updated drizzle-orm to latest beta

## 0.0.16

### Patch Changes

- 0727690: Added nested relations

## 0.0.15

### Patch Changes

- 665b4bd: Added support for attributes

  You can now use attributes when defining relations. Attributes are a way to
  add additional checks on related subjects. For example, before, you would've
  defined static attributes in a relation like this:

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

## 0.0.14

### Patch Changes

- 352aa0b: Bump versions

## 0.0.13

### Patch Changes

- 64d078d: Added Express adapter

## 0.0.12

### Patch Changes

- 9719091: Added new field comparison operators

  `$in`, `$nin`, `$lt`, `$lte`, `$gt` and `$gte` are now supported for all field
  types.

## 0.0.11

## 0.0.10

## 0.0.9

### Patch Changes

- 4ae5742: Fix package.json repository for provenance

## 0.0.8

### Patch Changes

- 26c39a4: Bump versions

## 0.0.7

### Patch Changes

- 1daa131: Publish packages with provenance

## 0.0.6

### Patch Changes

- f0dac00: Bump versions

## 0.0.5

### Patch Changes

- d21b026: Bump versions

## 0.0.4

### Patch Changes

- d937ba9: Bump versions

## 0.0.3

### Patch Changes

- Add version to prettier

## 0.0.2

### Patch Changes

- Fixed build

## 0.0.1

### Patch Changes

- Initial release
