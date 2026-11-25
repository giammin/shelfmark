# Authentication (AUTH)

## AUTH-001 Sign in with Google

The user signs in to shelfmark with a Google account.

Acceptance criteria:

- A user who is not signed in cannot see or change any catalog data; the app offers only the sign-in.
- Sign-in uses a Google account; no other sign-in method is offered.
- After a successful sign-in, the app opens the book list.
- When the sign-in is cancelled or fails, the user stays on the sign-in and is told that the sign-in did not complete.

Notes:

- Other sign-in methods may be added later.

## AUTH-002 Sign out

The signed-in user can sign out of shelfmark.

Acceptance criteria:

- A signed-in user can sign out from within the app.
- After signing out, the app offers only the sign-in, and no catalog data of the previous user can be seen, including by navigating back.
- After signing out, the next sign-in can use a different Google account.

## AUTH-003 Stay signed in

The user stays signed in between uses of the app until they sign out.

Acceptance criteria:

- Closing and reopening the app, installed or in the browser, does not require signing in again.
- Reopening the app while signed in opens the book list directly.
