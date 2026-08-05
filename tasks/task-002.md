# Task 002 — Harden global cache transaction rollback

Review and correct the implementation from `tasks/task-001.md`. Do not commit.

## Blocking issue

`publishGlobal()` currently groups all rollback operations inside a single `try`. If restoring `state.json` fails, restoration of `current/` is skipped. Rollback must attempt every independent recovery step and aggregate all failures.

There is also a commit/cleanup hazard: after both new paths are published, one backup may be deleted successfully and deletion of the other may fail. The current catch path can then try to roll back using a backup that no longer exists, risking loss of the previous installation.

## Required changes

1. Separate transaction phases clearly:
   - prepare staging;
   - move existing destinations to backups;
   - publish staged `current/`;
   - publish staged `state.json`;
   - mark transaction committed;
   - clean backups as post-commit cleanup.

2. Before commit:
   - on any failure, attempt every applicable rollback action independently;
   - do not stop rollback because one action failed;
   - collect all rollback and cleanup errors;
   - restore both `current/` and `state.json` whenever their backups exist;
   - preserve the original failure together with all recovery failures using `AggregateError`.

3. After commit:
   - backup cleanup failure must not trigger rollback using backups already removed;
   - never delete the newly committed installation because post-commit cleanup failed;
   - report cleanup failure diagnostically while preserving the valid committed state, or retain leftover backup safely for later cleanup.

4. Apply the same independent-cleanup discipline to failures during staging preparation.

5. Do not change the existing local `install`, `update`, or `status` behavior.

## Tests to add

Add regression tests proving that:

1. failure restoring `state.json` does not prevent an attempted restoration of `current/`;
2. failure restoring `current/` does not prevent cleanup/restoration attempts for `state.json`;
3. failure deleting one backup after commit does not remove or corrupt the newly committed global installation;
4. all relevant errors are visible in the resulting `AggregateError`;
5. no staging paths remain after successful rollback when cleanup operations themselves do not fail.

Use injected filesystem operations or a small internal transaction dependency object so failures can be simulated deterministically. Do not mutate the real user home.

## Validation

Run:

- `node --test test/global-installation.test.mjs`
- `npm test`
- `git diff --check`

At the end, provide:
- cause and design of the correction;
- files changed;
- tests added;
- test results;
- `git status --short`.

Do not commit.
