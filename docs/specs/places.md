# Places (PLACE)

A place is a physical site where the user keeps books (e.g. home). Locations and books belong to a place. In the beta each user has exactly one place, created automatically.

## PLACE-001 Default place

At the first sign-in, the app creates a place for the user, which holds all their locations and books.

Acceptance criteria:

- At the first sign-in, the app creates a place named "{NAME}'s library", where {NAME} is the user's first name from their Google account.
- The place name is generated in the app's language at the time of creation (English in the beta) and does not change if the language changes later.
- Signing in again, on the same or another device, never creates a second place.
- While the user has a single place, the app neither asks the user to choose a place nor shows the place name.

Notes:

- Multiple places, editable place names and sharing are planned for later phases.

## PLACE-002 Private place

The data of a user's place is accessible only to that user.

Acceptance criteria:

- A user cannot see the locations or books of another user's place.
- A user cannot create, change or delete locations or books in another user's place.

Notes:

- With sharing (a later phase), members invited to a place will also have access, according to their role.
