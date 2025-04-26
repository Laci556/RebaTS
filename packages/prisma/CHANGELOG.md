# @rebats/prisma

## 0.0.16

### Patch Changes

- 0727690: Added nested relations
- Updated dependencies [0727690]
  - @rebats/core@0.0.16

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

- Updated dependencies [665b4bd]
  - @rebats/core@0.0.15

## 0.0.14

### Patch Changes

- 352aa0b: Bump versions
- Updated dependencies [352aa0b]
  - @rebats/core@0.0.14

## 0.0.13

### Patch Changes

- 64d078d: Added Express adapter
- Updated dependencies [64d078d]
  - @rebats/core@0.0.13

## 0.0.12

### Patch Changes

- 9719091: Added new field comparison operators

  `$in`, `$nin`, `$lt`, `$lte`, `$gt` and `$gte` are now supported for all field
  types.

- Updated dependencies [9719091]
  - @rebats/core@0.0.12

## 0.0.11

### Patch Changes

- @rebats/core@0.0.11

## 0.0.10

### Patch Changes

- @rebats/core@0.0.10

## 0.0.9

### Patch Changes

- 4ae5742: Fix package.json repository for provenance
- Updated dependencies [4ae5742]
  - @rebats/core@0.0.9

## 0.0.8

### Patch Changes

- 26c39a4: Bump versions
- Updated dependencies [26c39a4]
  - @rebats/core@0.0.8

## 0.0.7

### Patch Changes

- 1daa131: Publish packages with provenance
- Updated dependencies [1daa131]
  - @rebats/core@0.0.7

## 0.0.6

### Patch Changes

- f0dac00: Bump versions
- Updated dependencies [f0dac00]
  - @rebats/core@0.0.6

## 0.0.5

### Patch Changes

- d21b026: Bump versions
- Updated dependencies [d21b026]
  - @rebats/core@0.0.5

## 0.0.4

### Patch Changes

- Updated dependencies [d937ba9]
  - @rebats/core@0.0.4

## 0.0.3

### Patch Changes

- Add version to prettier
- Updated dependencies
  - @rebats/core@0.0.3

## 0.0.2

### Patch Changes

- Fixed build
- Updated dependencies
  - @rebats/core@0.0.2

## 0.0.1

### Patch Changes

- Initial release
- Updated dependencies
  - @rebats/core@0.0.1
