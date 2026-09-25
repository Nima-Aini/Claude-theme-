# AKMA Store

## Production setup

Set `DATABASE_URL`, a random `JWT_SECRET` of at least 32 characters, and an absolute persistent `UPLOAD_DIR`. The default deployment uses `/var/lib/project1/uploads`. The PM2 user must be able to read and write that directory. `UPLOAD_PUBLIC_PATH` defaults to `/media`.

Run database migrations before starting a new release:

```sh
npm run db:migrate
```

For online payments, set `ZARINPAL_MERCHANT_ID` and the public HTTPS `SITE_URL` in the production environment before deploying. The callback registered with Zarinpal is `<SITE_URL>/api/payment/zarinpal/callback?orderId=<order-id>`; the gateway appends `Authority` and `Status`. Database prices, request amounts, and verification amounts all use toman (`IRT`). The GitHub Actions deploy workflow runs migrations before the build and PM2 restart. Payment gateway credentials must never be committed.

Create the first administrator once, only while the `admins` table is empty:

```sh
SEED_ADMIN_USERNAME=owner SEED_ADMIN_PASSWORD='a-long-private-password' npm run admin:create
```

The command refuses to modify an existing administrator. Change existing or legacy plaintext passwords through an authenticated maintenance process; the login endpoint accepts bcrypt hashes only.

## Uploaded images

New images are stored outside the application release and served through `/media/...`. Do not place `UPLOAD_DIR` inside the Git checkout. Back up this directory together with PostgreSQL.

For an older installation, copy the contents of `public/uploads` into `UPLOAD_DIR` while preserving the `products`, `shops`, and `banners` subdirectories, then update stored URL prefixes from `/uploads/` to `/media/` in a database backup or controlled migration. Existing `/uploads/` files included in an old standalone release remain readable during the transition.

Rollback requires restoring the PostgreSQL backup taken before migration and deploying the previous release. The added nullable columns are backward compatible and may remain in place.

## Image presets

Product and shop images are square. Slider images use 16:9. Bottom banners use 16:5, and shop banners use 8:3 on desktop and 2:1 on mobile. The administration crop preview uses the same ratios as the storefront.
