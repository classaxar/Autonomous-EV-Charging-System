# Git Conventions & Branching Strategy

Adherence to these rules is strictly enforced across all 3 developers.

## 1. Branching Model
- **`main`**: Production & demo-ready releases only. Tagged at milestones (`v0.5-demo`, `v1.0.0`).
- **`develop`**: Primary integration branch. All feature branches merge here via PR.
- **`feature/<TASK-ID>-<slug>`**: Feature branches (e.g. `feature/A-01-skeleton`, `feature/B-02-station-service`).

## 2. Rules of Engagement
1. **One task ID = one branch = one PR**. Never batch multiple tasks.
2. **Never commit directly to `main` or `develop`**.
3. **Always branch from updated develop**:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/<TASK-ID>-<slug>
   ```
4. **Ownership boundary**: Edit only files within your assigned ownership paths (RULEBOOK §1). Touching another developer's path results in automatic PR rejection.

## 3. Commit Message Syntax
Format: `<type>(<scope>): <short description>`
- `feat(service): ...`
- `fix(service): ...`
- `docker: ...`
- `k8s: ...`
- `docs: ...`
- `test(service): ...`

## 4. Definition of Done (PR Gate)
- [ ] Meets task's "Done when" criteria.
- [ ] Only owned paths modified.
- [ ] `GET /health` passes and Docker build succeeds.
- [ ] Verified via automated tests or Postman/curl.
- [ ] TASKBOOK item checked `[x]` in the same PR.
