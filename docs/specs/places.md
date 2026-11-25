# Places (PLACE)

A place is a physical site where the user keeps books (e.g. home). Locations and books belong to a place. In the beta each user has exactly one place, created automatically.

## PLACE-001 Default place

At the first sign-in, the app creates a place for the user, which holds all their locations and books.

Acceptance criteria:

- At the first sign-in, the app creates a place named "{NAME}'s library", where {NAME} is the user's first name from their Google account.
- The place name is generated in the user's language at the time of creation.
- Signing in again, on the same or another device, never creates a second place.
- While the user has a single place, the app neither asks the user to choose a place nor shows the place name.

Notes:

- Multiple places, editable place names and sharing are planned for later phases.
