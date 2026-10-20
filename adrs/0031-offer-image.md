# 31. An image per offer

- Status: Accepted
- Date: 2026-10-20
- Complements ADR-0026 (backups) and ADR-0027 (named volume)

## Context

The user wants to attach an image to an offer (typically a screenshot of the job ad, which may disappear from the job board), shown small and enlarged on click. Images would soon outweigh everything else in the database, so they shouldn't live in it.

## Decision

**Data.** At most one image per offer. JPEG, PNG, WebP and GIF only, recognised from their first bytes (magic numbers), never from the declared `Content-Type`. No SVG: it can carry scripts. At most 10 MiB.

- **The bytes are files**, one per offer named after its id, in `IMAGES_DIR` (`back/src/offer-images/offer-image-store.ts`). In the cluster that is `/var/lib/emploi/images`, a static PersistentVolume (`emploi-images`, `Retain`, claim `offer-images` mounted in the back pod) inside the named Docker volume `emploi-data` of ADR-0027: the images survive the pods, the node container and `k3d cluster delete`, like the database. Object storage (MinIO, S3) was rejected: one more service to run for files a single API reads.
- **The database only describes them**: table `offer_images` (`offer_id` primary key and foreign key with `ON DELETE CASCADE`, `content_type`, `byte_size`, `updated_at`), so listing offers reads no image data and dumps stay small.
- File and row are kept consistent by order: an upload is written under a temporary name, the row is saved (which fails when the offer doesn't exist), then the file is renamed in place (atomic, replacing the previous image), or the temporary file is removed. Deleting the image or the offer deletes the row, then the file.
- The back pod mounts the volume as its only writable path (read-only root filesystem). The node creates the directory as root: an init container, running as root with no capability but `CHOWN`, hands it to the API's user.
- **Backups**: `make db-backup` writes `emploi-<date>-images.tar` (a `tar` of the directory, taken in the back pod) next to `emploi-<date>.dump`; `make db-restore FILE=<dump>` restores the matching archive when there is one. A backup is only as consistent as these two moments.

**API.** A sub-resource of the offer:

- `PUT /offers/:offerId/image`: the raw image as the body, with its `Content-Type` (`image/jpeg`…). Replaces the current image. A raw body rather than `multipart/form-data`: one value, simplest for any client (`curl --data-binary`), and no upload library. The controller reads the stream itself and stops past the limit.
- `GET /offers/:offerId/image`: the bytes with their stored type; `DELETE /offers/:offerId/image`.
- Errors are Problem Details (ADR-0024) with two new kinds: `unsupported-image` (415) and `image-too-large` (413); a missing image is `resource-not-found` with `resource: offer-image`.
- Offers carry `image: { contentType, byteSize, updatedAt } | null`, so clients know whether there is one and can bust caches with `updatedAt`.
- The MCP tools don't upload or download images (binary content), but `get_offer` and `list_offers` show `image`. The coverage test lists the three operations as excluded, with that reason.

**Front.** The browser still never calls the API (ADR-0012):

- The offer form has a file input (the design system `TextField` with `type="file"`); the server action validates type and size, saves the offer, then sends the image. Server Actions accept bodies up to 11 MB (`serverActions.bodySizeLimit`, and `proxyClientMaxBodySize` since the proxy buffers request bodies).
- A route handler, `GET /offers/:id/image`, streams the image from the API, so `img-src 'self'` (ADR-0029) still holds.
- The offer page shows a thumbnail that opens the full image in a modal `<dialog>` (design system `ImagePreview`); a confirmed button removes it.

## Consequences

- The images take space on the Docker volume, not in the database; backups are two files. A database restored without its archive describes images whose files are missing: the API answers 404 for them and logs it.
- A new offer whose image the API refuses after the front's checks (e.g. a renamed file) is saved without it; the user is sent to its edit page with an error.
- Thumbnails are the full image scaled by CSS: no resizing service.
