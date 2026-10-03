// pnpm hooks: https://pnpm.io/pnpmfile

/**
 * @prisma/client declares `prisma` (the CLI, which pulls in Prisma Studio) and
 * `typescript` as optional peer dependencies. Because `back` has both as dev
 * dependencies, pnpm links them to the client, and production installs
 * (`pnpm deploy --prod` in back/Dockerfile) then ship them, ~180 MB the API never
 * loads: the generated client only imports `@prisma/client/runtime/*`.
 * Dropping the two optional peers keeps them out of production; development
 * still has both through `back`'s dev dependencies.
 */
function readPackage(pkg) {
  if (pkg.name === '@prisma/client') {
    for (const peer of ['prisma', 'typescript']) {
      delete pkg.peerDependencies?.[peer];
      delete pkg.peerDependenciesMeta?.[peer];
    }
  }
  return pkg;
}

module.exports = { hooks: { readPackage } };
