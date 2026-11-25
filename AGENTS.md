# shelfmark

Working document: `docs/working-doc.md`. Read it before taking any action and keep it updated.

## Language

Use English for everything: code, comments, commit messages, branches, issues, pull requests, reviews, specifications, design documents and the working document.

## Internationalization

The app is prepared for several languages but currently ships in English only, using `@angular/localize` with source locale `en-US`.

- Mark every user-visible text in templates with `i18n` and every user-visible attribute with `i18n-<attribute>`, always with a custom ID: `i18n="@@area.purpose"` (e.g. `@@locations.addButton`). The linter enforces this for templates.
- Write user-visible strings in TypeScript with `$localize`, also with a custom ID: `` $localize`:@@area.purpose:Text` ``. The linter does not check TypeScript: reviews must.
- Data created for the user, such as the default place name, must be generated in the user's language at creation time.

## Pull requests

Pull requests are squash-merged: the pull request title becomes the commit message on `main`.
Pull request titles must follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>[optional scope]: <description>`, e.g. `feat(books): add ISBN lookup`.
Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Mark breaking changes with `!` after the type or scope.
Commit messages on branches are free-form, since they are squashed on merge.