# shelfmark

Working document: `docs/working-doc.md`. Read it before taking any action and keep it updated.

## Language

Use English for everything: code, comments, commit messages, branches, issues, pull requests, reviews, specifications, design documents and the working document.

## Pull requests

Pull requests are squash-merged: the pull request title becomes the commit message on `main`.
Pull request titles must follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>[optional scope]: <description>`, e.g. `feat(books): add ISBN lookup`.
Allowed types: `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`. Mark breaking changes with `!` after the type or scope.
Commit messages on branches are free-form, since they are squashed on merge.