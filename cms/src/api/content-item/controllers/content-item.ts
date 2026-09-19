import { factories } from '@strapi/strapi';

// The public REST API (used by the unauthenticated frontend) must only ever
// serve published content. Strapi's default core controller respects a
// client-supplied `?status=draft` query param even for the anonymous/public
// role, which lets anyone read unpublished staff content before it's meant
// to be visible (verified live: `curl '.../api/content-items?status=draft'`
// returned real draft rows with an anonymous request). Draft content is
// managed exclusively through the authenticated Strapi admin panel
// (/content-manager/*, which already requires a login) - this public route
// has no legitimate reason to ever return anything but published entries,
// so we force that server-side regardless of what the caller requests.
export default factories.createCoreController('api::content-item.content-item', () => ({
  async find(ctx) {
    ctx.query = { ...ctx.query, status: 'published' };
    return super.find(ctx);
  },
  async findOne(ctx) {
    ctx.query = { ...ctx.query, status: 'published' };
    return super.findOne(ctx);
  },
}));
