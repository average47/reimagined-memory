#!/usr/bin/env bash
#
# Idempotent headless, multi-tenant WordPress initializer (run by `wp-cli`).
# - Waits for wp-config.php (written by the wordpress container) and the DB.
# - Installs WordPress core on first run.
# - Converts the install into a subdirectory Multisite network.
# - Creates the brand tenant sites (5 brands + the unbranded primary site).
# - Network-activates WPGraphQL so every tenant exposes /graphql.
# - Writes the subdirectory-multisite .htaccess and flushes rewrites.
set -euo pipefail

BASE_URL="${WORDPRESS_SITE_URL}"

# Brand tenants, as "slug:Title" pairs. Every brand — AMC+ included — gets its
# own subdirectory site, so the primary (network) site at `/` belongs to no
# brand and serves as the unbranded default (see step 3b).
# Existing sites are left untouched (matched by path), so titles set in the
# admin are preserved.
TENANTS=(
  "amcplus:AMC+"
  "shudder:Shudder"
  "acorn:Acorn"
  "sundancenow:Sundance Now"
  "wetv:We TV"
)

echo "Waiting for wp-config.php..."
until [ -f /var/www/html/wp-config.php ]; do
  sleep 3
done

echo "Waiting for database..."
until wp db check >/dev/null 2>&1; do
  sleep 3
done

# 1. Install WordPress core (single site) on first run.
if ! wp core is-installed >/dev/null 2>&1; then
  echo "Installing WordPress core..."
  wp core install \
    --url="${BASE_URL}" \
    --title="${WORDPRESS_SITE_TITLE}" \
    --admin_user="${WORDPRESS_ADMIN_USER}" \
    --admin_password="${WORDPRESS_ADMIN_PASSWORD}" \
    --admin_email="${WORDPRESS_ADMIN_EMAIL}" \
    --skip-email
else
  echo "WordPress core already installed — skipping."
fi

# 2. Convert to a subdirectory Multisite network on first run.
if ! wp core is-installed --network >/dev/null 2>&1; then
  echo "Converting to a Multisite network..."
  wp core multisite-convert --title="${WORDPRESS_SITE_TITLE} Network"
else
  echo "Multisite network already configured — skipping."
fi

# 3. Create the additional tenant sites (idempotent).
existing_paths="$(wp site list --field=path 2>/dev/null || true)"
for entry in "${TENANTS[@]}"; do
  slug="${entry%%:*}"
  title="${entry#*:}"
  if printf '%s\n' "${existing_paths}" | grep -qx "/${slug}/"; then
    echo "Tenant '${slug}' already exists — skipping."
  else
    echo "Creating tenant '${slug}'..."
    wp site create --slug="${slug}" --title="${title}" --email="${WORDPRESS_ADMIN_EMAIL}"
  fi
done

# 3b. The primary site belongs to no brand. Fresh installs already get the
# neutral "${WORDPRESS_SITE_TITLE}" from `wp core install` above, but installs
# created before AMC+ moved to its own tenant still carry "AMC+" at `/`. Rename
# only that exact stale value, so a title deliberately set in the admin is kept.
primary_title="$(wp option get blogname --url="${BASE_URL}" 2>/dev/null || true)"
if [ "${primary_title}" = "AMC+" ]; then
  echo "Primary site is still titled 'AMC+' — renaming to '${WORDPRESS_SITE_TITLE}'..."
  wp option update blogname "${WORDPRESS_SITE_TITLE}" --url="${BASE_URL}"
else
  echo "Primary site title ('${primary_title}') is not the stale brand default — leaving it."
fi

# 4. Update core files to the target version, then apply DB upgrades.
# The official image only copies core files into an empty volume, so an existing
# install must be updated explicitly to match a bumped image tag.
if [ -n "${WORDPRESS_CORE_VERSION:-}" ] && \
   [ "$(wp core version)" != "${WORDPRESS_CORE_VERSION}" ]; then
  echo "Updating WordPress core to ${WORDPRESS_CORE_VERSION}..."
  wp core update --version="${WORDPRESS_CORE_VERSION}" --force
fi
echo "Applying core database upgrades (all tenants)..."
wp core update-db --network

# 5. Install + network-activate WPGraphQL so every tenant exposes /graphql.
echo "Ensuring WPGraphQL is installed and network-activated..."
wp plugin is-installed wp-graphql || wp plugin install wp-graphql
wp plugin activate wp-graphql --network

# 6. Write the subdirectory-multisite .htaccess (wp-cli can't regenerate it).
echo "Writing multisite .htaccess..."
cat > /var/www/html/.htaccess <<'HTACCESS'
# BEGIN WordPress Multisite
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteBase /
RewriteRule ^index\.php$ - [L]

# add a trailing slash to /wp-admin
RewriteRule ^([_0-9a-zA-Z-]+/)?wp-admin$ $1wp-admin/ [R=301,L]

RewriteCond %{REQUEST_FILENAME} -f [OR]
RewriteCond %{REQUEST_FILENAME} -d
RewriteRule ^ - [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(wp-(content|admin|includes).*) $2 [L]
RewriteRule ^([_0-9a-zA-Z-]+/)?(.*\.php)$ $2 [L]
RewriteRule . index.php [L]
# END WordPress Multisite
HTACCESS

# 7. Flush rewrites for every tenant so /graphql resolves per site.
echo "Flushing rewrites for each tenant..."
wp site list --field=url | while read -r site_url; do
  wp rewrite structure '/%postname%/' --url="${site_url}" >/dev/null 2>&1 || true
  wp rewrite flush --url="${site_url}" >/dev/null 2>&1 || true
done

# 8. Theme: the `mosaic` block theme (editable header/footer) is the only theme.
# Make it the default constant, network-enable + activate it on every tenant,
# then remove any other theme. Idempotent.
echo "Configuring the Mosaic theme..."
wp config set WP_DEFAULT_THEME mosaic --type=constant --quiet 2>/dev/null || true
wp theme enable mosaic --network --activate >/dev/null 2>&1 || true
wp site list --field=url | while read -r site_url; do
  wp theme activate mosaic --url="${site_url}" >/dev/null 2>&1 || true
done
for theme in $(wp theme list --field=name 2>/dev/null); do
  if [ "${theme}" != "mosaic" ]; then
    echo "Removing theme '${theme}'..."
    wp theme delete "${theme}" >/dev/null 2>&1 || true
  fi
done

# 8b. Seed example Header/Footer menus on the primary site (idempotent — only
# when the footer location is unassigned). Authored thereafter via Appearance →
# Menus and consumed by Next.js over WPGraphQL (by location).
if ! wp menu list --fields=locations --format=csv --url="${BASE_URL}" 2>/dev/null | grep -q footer; then
  echo "Seeding example Header/Footer menus..."
  hm=$(wp menu create "Header" --porcelain --url="${BASE_URL}")
  wp menu item add-custom "${hm}" "Home" "/" --url="${BASE_URL}" >/dev/null
  wp menu item add-custom "${hm}" "Movies" "/movies" --url="${BASE_URL}" >/dev/null
  wp menu item add-custom "${hm}" "Series" "/series" --url="${BASE_URL}" >/dev/null
  wp menu location assign "${hm}" header --url="${BASE_URL}" >/dev/null

  fm=$(wp menu create "Footer" --porcelain --url="${BASE_URL}")
  ex=$(wp menu item add-custom "${fm}" "Explore" "#" --porcelain --url="${BASE_URL}")
  wp menu item add-custom "${fm}" "Movies" "/movies" --parent-id="${ex}" --url="${BASE_URL}" >/dev/null
  wp menu item add-custom "${fm}" "TV Series" "/series" --parent-id="${ex}" --url="${BASE_URL}" >/dev/null
  co=$(wp menu item add-custom "${fm}" "Company" "#" --porcelain --url="${BASE_URL}")
  wp menu item add-custom "${fm}" "About" "/about" --parent-id="${co}" --url="${BASE_URL}" >/dev/null
  wp menu item add-custom "${fm}" "Careers" "/careers" --parent-id="${co}" --url="${BASE_URL}" >/dev/null
  wp menu location assign "${fm}" footer --url="${BASE_URL}" >/dev/null
fi

# 9. Optionally import a schema.org feed into the movie/tv_series/tv_season
# types. Skipped when WORDPRESS_IMPORT_FEED_URL is unset; non-fatal on failure.
if [ -n "${WORDPRESS_IMPORT_FEED_URL:-}" ]; then
  echo "Importing schema.org feed into the primary site..."
  wp schema import --url="${BASE_URL}" || echo "Feed import failed — continuing."
else
  echo "No WORDPRESS_IMPORT_FEED_URL set — skipping feed import."
fi

echo ""
echo "Headless multi-tenant WordPress is ready. Tenants:"
wp site list --fields=blog_id,url --format=table
echo ""
echo "Each tenant exposes:  <url>graphql  and  <url>wp-json/wp/v2"
echo "Admin: ${BASE_URL}/wp-admin  (user: ${WORDPRESS_ADMIN_USER})"
