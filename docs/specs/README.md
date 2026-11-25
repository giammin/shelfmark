# Functional specifications

This folder describes what shelfmark does from the user's point of view. How it is built (modules, components, data model, security rules) belongs to `docs/design/`.

## Scope

The current target is the beta: sign-in with Google, a single default place, locations, single-book entry and the book list. Later phases (batch entry, multiple places, sharing) will be added as changes to these specifications.

## Areas

| Prefix | File | Content |
|---|---|---|
| `AUTH` | [auth.md](auth.md) | Sign-in and session |
| `PLACE` | [places.md](places.md) | The user's place |
| `LOC` | [locations.md](locations.md) | Locations and their hierarchy |

## Requirement IDs

- Each requirement has a stable ID made of an area prefix and a three-digit number, numbered per area (e.g. `AUTH-001`, `LOC-003`).
- IDs are never reused. A removed requirement keeps its ID and is listed in [Withdrawn requirements](#withdrawn-requirements) with the reason.
- Issues, acceptance criteria, clarification requests and reviews cite requirements by ID.

## Requirement format

Each requirement has:

- a heading with its ID and a short title;
- a one-sentence statement of what the user can do or what the app does;
- 2-4 testable acceptance criteria;
- optional notes, for context that is not itself a requirement.

## Unspecified behavior

These specifications do not describe every case. When a behavior is not specified, do not assume one: ask for clarification on the issue, citing the related requirement IDs.

## Withdrawn requirements

None.
