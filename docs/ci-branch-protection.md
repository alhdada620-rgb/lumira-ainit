# Branch protection: require CI before deploy

Production deploys only run after the **CI / build** workflow succeeds on `main`
(see `.github/workflows/deploy.yml`, which uses `workflow_run`). To make this
guarantee enforceable — so nobody can merge or push to `main` without a green
build — add a required status check in GitHub.

## One-time GitHub setup

1. Open the repo on GitHub → **Settings** → **Branches** (or **Rules → Rulesets**).
2. **Add branch protection rule** (or **New ruleset** → Target `main`).
3. Branch name pattern: `main`.
4. Enable:
   - ✅ **Require a pull request before merging**
   - ✅ **Require status checks to pass before merging**
   - ✅ **Require branches to be up to date before merging**
5. Under **Status checks that are required**, search and add:
   - `build` — from the `CI` workflow (`.github/workflows/ci.yml`)
6. (Recommended) Also enable:
   - ✅ **Do not allow bypassing the above settings**
   - ✅ **Restrict who can push to matching branches**
7. Save.

> The check is named `build` because `ci.yml` sets `jobs.build.name: build`.
> If you rename the job, update the required check in branch protection too.

## How the gate works end-to-end

1. PR opened → `CI` runs `lint` + `build` (build fails if `index.html` contains
   `/src/index.tsx`, via the `forbidDevSrcScriptInIndexHtml` Vite plugin).
2. Branch protection blocks merge until `build` is green.
3. Merge to `main` → `CI` runs again on `main`.
4. `deploy.yml` listens via `workflow_run` and only calls the Cloudflare Pages
   deploy hook when `github.event.workflow_run.conclusion == 'success'`.
5. Any non-success conclusion runs the `skipped` job, which fails loudly so a
   broken build cannot ship to production.

## Verifying

- Open a PR that intentionally puts `<script src="/src/index.tsx">` back into
  `index.html`. CI should fail at the build step and the PR should be
  unmergeable.
- Revert → CI passes → merge → `Trigger Cloudflare Pages Deploy` runs and
  production updates.
