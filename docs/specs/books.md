# Books (BOOK)

A book is a physical copy kept in a location of the user's place.

## BOOK-001 Book list

The user can see the books of their place in a list, which is the first view of the app.

Acceptance criteria:

- The list shows every book of the place with its title, its authors and its location.
- The list is the view the app opens after sign-in and at startup (AUTH-001, AUTH-003).
- When the place has no books, the list says so and offers to add one.

## BOOK-002 Look up a book by ISBN

The user can start adding a book from its ISBN, scanned with the device camera or typed by hand.

Acceptance criteria:

- From the book list, the user can start adding a book by scanning its ISBN barcode.
- The user can type the ISBN instead of scanning it, for example when the barcode cannot be read.
- When scanning is not available (e.g. no camera, camera permission denied, unsupported browser), the app says so and offers typing the ISBN.
- When an ISBN is scanned or typed, the app checks that it is a valid ISBN and looks up the book's data automatically (BOOK-003); an invalid ISBN is reported, no lookup starts, and the user can correct it.

## BOOK-003 Automatic book data

When the user provides an ISBN, the app fills in the book's data from an online book database.

Acceptance criteria:

- When the lookup finds the book, its data is filled in and the user can correct it before saving.
- When the lookup finds the book but some data is missing, the user can complete it before saving.
- When the lookup finds nothing, the app says so and continues with manual entry (BOOK-004), keeping the ISBN.
- When the lookup cannot be completed (e.g. no connection, service unavailable), the app says that the lookup failed, distinctly from "not found", and continues with manual entry, keeping the ISBN.

Notes:

- Coverage of Italian books in the current database is weak, so manual entry will be frequent.

## BOOK-004 Manual entry

The user can enter a book's data by hand.

Acceptance criteria:

- From the book list, the user can start adding a book by entering its data by hand, without a lookup.
- A book has these data fields: ISBN, title, authors, publisher, year of publication and cover; the cover comes only from the lookup.
- Manual entry offers all the data fields except possibly the cover (see notes).

Notes:

- Whether manual entry includes a cover (e.g. a photo taken by the user) is left to the design.
- More fields, such as those usually available from Google Books, may be added later.

## BOOK-005 Save a book

When adding a book, the user assigns it to a location and saves it.

Acceptance criteria:

- Whatever the entry path (lookup or manual), a book cannot be saved without a title and a location, chosen among the locations of the place.
- While adding a book, the user can create a new location without leaving the entry, with the same rules as LOC-002, including when the place has no locations yet.
- The app records, for each book, where its data came from: the book database that provided it, or manual entry.
- After saving, the book appears in the book list with its location.

## BOOK-006 Edit a book

The user can correct the data of a book already saved.

Acceptance criteria:

- The user can change the data of any book, with the same fields as at entry (BOOK-004) and the same title rule (BOOK-005).
- Changing the ISBN does not start a new lookup.
- The changes are shown wherever the book appears.

Notes:

- Changing the location of a saved book is not part of the beta; it will be specified together with multiple places.

## BOOK-007 Delete a book

The user can delete a book.

Acceptance criteria:

- The user can delete any book.
- The app asks the user to confirm before deleting; if the user does not confirm, nothing changes.
- After deletion, the book no longer appears anywhere in the app.
