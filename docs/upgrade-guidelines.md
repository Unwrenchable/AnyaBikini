# Upgrade & Extension Guidelines

This document provides guidance for upgrading and extending the AnyaBikini project.

## Upgrading

- **Dependencies:**
  - Use `npm outdated` and `npm update` regularly.
  - Review changelogs for breaking changes before upgrading major versions.
  - Test thoroughly after upgrades.

- **Node.js Version:**
  - Use the version specified in `.nvmrc` or `package.json` engines field.

- **Environment Variables:**
  - Document any new variables in `server/.env.example` and `README.md`.

- **Database:**
  - If you migrate from JSON to SQL/NoSQL, write migration scripts and document the process in `/docs`.

## Extending

- **Add new features as services/controllers:**
  - Place business logic in `/server/services`.
  - Add new API endpoints in `/server/controllers` or directly in `index.js` (then refactor to controllers).

- **API Documentation:**
  - Document new endpoints in `/docs/api.md` or `/docs/README.md`.

- **Testing:**
  - Add tests for new features (consider Jest or Mocha).

- **Frontend:**
  - Keep JS modular and document new UI components.

## Best Practices

- Keep code modular and well-commented.
- Use semantic versioning for releases.
- Update documentation with every change.
- Review security best practices regularly.

---

For major upgrades or architecture changes, add a migration guide in this folder.
