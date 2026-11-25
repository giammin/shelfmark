# Locations (LOC)

A location is where books are kept within a place (e.g. a room, a bookcase, a shelf). A location can optionally be inside another location, its parent, so the user can describe as much of the hierarchy as they need.

## LOC-001 View locations

The user can see all the locations of their place.

Acceptance criteria:

- The user can open a view that lists every location of their place.
- For each location with a parent, the view shows which location is its parent.
- When the place has no locations, the view says so and offers to create one.

## LOC-002 Create a location

The user can create a location, optionally inside another location.

Acceptance criteria:

- A location cannot be created without a name; a name made only of spaces counts as no name.
- The parent is optional and can be any existing location of the place, at any depth; a location without a parent is a top-level location.
- Two locations with the same parent, or two top-level locations, cannot have the same name; names are compared ignoring letter case.
- After creation, the location appears in the view of LOC-001.

Notes:

- The hierarchy has no depth limit.

## LOC-003 Rename a location

The user can change the name of a location.

Acceptance criteria:

- The user can change the name of any location.
- The new name follows the same naming rules as at creation (LOC-002).
- The new name is shown wherever the location appears, including as the parent of other locations and as the location of books.

## LOC-004 Delete an empty location

The user can delete a location that contains no books and no other locations.

Acceptance criteria:

- The user can delete a location that has no books assigned and is not the parent of any location.
- The app asks the user to confirm before deleting; if the user does not confirm, nothing changes.
- After deletion, the location no longer appears anywhere in the app.
