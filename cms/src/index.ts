import type { Core } from '@strapi/strapi';
import { CONTENT_SEED } from './seed-data';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * Content items are official campus information, not personal data, so we
   * grant the public role read-only access at boot. This lets the React
   * frontend read published content without a Strapi API token while all
   * writes still require an authenticated staff/admin session in the Strapi
   * admin panel (BR11/BR12, NFR4).
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const actions = [
      'api::content-item.content-item.find',
      'api::content-item.content-item.findOne',
    ];

    for (const action of actions) {
      const existing = await strapi.query('plugin::users-permissions.permission').findOne({
        where: { action, role: publicRole.id },
      });
      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action, role: publicRole.id },
        });
      }
    }

    await seedContentItemsIfEmpty(strapi);
  },
};

// Demo data only (see /cms/src/seed-data.ts) — runs once on first boot so the
// prototype is demonstrable immediately after `npm run develop`, without a
// separate manual seed step to forget.
async function seedContentItemsIfEmpty(strapi: Core.Strapi) {
  const count = await strapi.documents('api::content-item.content-item').count({});
  if (count > 0) return;

  for (const entry of CONTENT_SEED) {
    await strapi.documents('api::content-item.content-item').create({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: entry as any,
      status: 'published',
    });
  }
  strapi.log.info(`[seed] created ${CONTENT_SEED.length} demo content items`);
}
