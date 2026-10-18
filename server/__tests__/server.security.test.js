const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const app = require("../index.js");

function request(app, options, body = null) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      const reqOptions = {
        hostname: "127.0.0.1",
        port,
        path: options.path,
        method: options.method || "GET",
        headers: options.headers || {},
      };

      const req = http.request(reqOptions, (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          server.close(() => {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              body: data,
            });
          });
        });
      });

      req.on("error", (err) => {
        server.close(() => reject(err));
      });

      if (body) {
        req.write(typeof body === "string" ? body : JSON.stringify(body));
      }
      req.end();
    });
  });
}

test("1. Health endpoint returns 200 OK", async () => {
  const res = await request(app, { path: "/api/health" });
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.status, "ok");
});

test("2. Unauthenticated sync push returns 401 Unauthorized", async () => {
  const res = await request(
    app,
    {
      path: "/api/sync/push",
      method: "POST",
      headers: { "Content-Type": "application/json" },
    },
    { queue: [] }
  );
  assert.equal(res.statusCode, 401);
  const data = JSON.parse(res.body);
  assert.match(data.error, /Unauthorized/);
});

test("3. Authenticated sync push succeeds with valid Bearer token", async () => {
  const res = await request(
    app,
    {
      path: "/api/sync/push",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      queue: [
        {
          id: "sec_test_1",
          entityType: "trip",
          action: "create",
          payload: {
            id: "trip-sec-xss",
            title: "Trekking <script>alert('xss')</script> Western Ghats",
            privacy: "link_only",
            shareSlug: "western-ghats-xss-test",
          },
        },
      ],
    }
  );
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
});

test("4. Trip title with HTML is escaped to prevent XSS on share page", async () => {
  const res = await request(app, {
    path: "/share/western-ghats-xss-test",
  });
  assert.equal(res.statusCode, 200);
  assert.ok(
    !res.body.includes("<script>alert('xss')</script>"),
    "Raw script tag should not exist in HTML"
  );
  assert.ok(
    res.body.includes("&lt;script&gt;alert(&#039;xss&#039;)&lt;/script&gt;") ||
      res.body.includes("&lt;script&gt;alert('xss')&lt;/script&gt;"),
    "Script tag should be properly HTML-escaped"
  );
});

test("5. Unknown share slug returns 404 Not Found (no fallback to db.trips[0])", async () => {
  const res = await request(app, {
    path: "/share/this-slug-does-not-exist-at-all",
  });
  assert.equal(res.statusCode, 404);
  assert.ok(res.body.includes("Expedition Not Found"));
});

test("6. Private trip returns 403 Forbidden on public share page", async () => {
  // Push a private trip first
  await request(
    app,
    {
      path: "/api/sync/push",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      queue: [
        {
          id: "sec_test_private",
          entityType: "trip",
          action: "create",
          payload: {
            id: "trip-private-secret",
            title: "Secret Private Trip",
            privacy: "private",
            shareSlug: "secret-private-trip",
          },
        },
      ],
    }
  );

  const res = await request(app, {
    path: "/share/secret-private-trip",
  });
  assert.equal(res.statusCode, 403);
  assert.ok(res.body.includes("Private Expedition"));
});

test("7. Unauthenticated pull strips private trips and private diary entries", async () => {
  // Push a private diary entry
  await request(
    app,
    {
      path: "/api/sync/push",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      queue: [
        {
          id: "sec_test_diary",
          entityType: "diary",
          action: "create",
          payload: {
            id: "diary-secret",
            tripId: "trip-1",
            text: "Confidential private reflection",
            isPrivate: true,
          },
        },
      ],
    }
  );

  const unauthRes = await request(app, { path: "/api/sync/pull" });
  assert.equal(unauthRes.statusCode, 200);
  const unauthData = JSON.parse(unauthRes.body);
  const foundPrivateTrip = unauthData.trips.find((t) => t.id === "trip-private-secret");
  assert.equal(foundPrivateTrip, undefined);
  const foundPrivateDiary = unauthData.diary_entries.find((d) => d.id === "diary-secret");
  assert.equal(foundPrivateDiary, undefined);
});

test("8. Unauthenticated /api/trips and /api/sync/pull exclude link_only trips", async () => {
  // Push a link_only trip
  await request(
    app,
    {
      path: "/api/sync/push",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      queue: [
        {
          id: "sec_test_link_only",
          entityType: "trip",
          action: "create",
          payload: {
            id: "trip-link-only-unlisted",
            title: "Unlisted Secret Hideaway",
            privacy: "link_only",
            shareSlug: "unlisted-secret-hideaway",
          },
        },
      ],
    }
  );

  // Unauthenticated /api/trips must not return it
  const tripsRes = await request(app, { path: "/api/trips" });
  assert.equal(tripsRes.statusCode, 200);
  const trips = JSON.parse(tripsRes.body);
  const foundInTrips = trips.find((t) => t.id === "trip-link-only-unlisted");
  assert.equal(foundInTrips, undefined, "link_only trip must not appear in public /api/trips");

  // Unauthenticated /api/sync/pull must not return it
  const pullRes = await request(app, { path: "/api/sync/pull" });
  assert.equal(pullRes.statusCode, 200);
  const pullData = JSON.parse(pullRes.body);
  const foundInPull = pullData.trips.find((t) => t.id === "trip-link-only-unlisted");
  assert.equal(foundInPull, undefined, "link_only trip must not appear in unauthenticated /api/sync/pull");
});

test("9. Direct lookup for link_only trip by slug/id succeeds", async () => {
  // Direct trip API lookup
  const tripRes = await request(app, { path: "/api/trips/unlisted-secret-hideaway" });
  assert.equal(tripRes.statusCode, 200);
  const tripData = JSON.parse(tripRes.body);
  assert.equal(tripData.trip.id, "trip-link-only-unlisted");

  // Direct share page lookup
  const shareRes = await request(app, { path: "/share/unlisted-secret-hideaway" });
  assert.equal(shareRes.statusCode, 200);
  assert.ok(shareRes.body.includes("Unlisted Secret Hideaway"));
});

test("10. Photo upload rejects non-image payload (e.g. HTML or malicious script) with 400 Bad Request", async () => {
  const maliciousHtml = Buffer.from("<script>alert('xss')</script>").toString("base64");
  const res = await request(
    app,
    {
      path: "/api/photos/upload",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      filename: "exploit.html",
      base64Data: maliciousHtml,
    }
  );
  assert.equal(res.statusCode, 400);
  const data = JSON.parse(res.body);
  assert.match(data.error, /Invalid file format/i);
});

test("11. Valid JPEG image upload succeeds and /uploads sets nosniff header", async () => {
  // Valid minimal JPEG binary with standard SOI (FF D8 FF E0) and EOI (FF D9)
  const validJpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0xFF, 0xD9,
  ]);
  const res = await request(
    app,
    {
      path: "/api/photos/upload",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer dev-sync-token-secret",
      },
    },
    {
      filename: "client_tried_html.html",
      base64Data: validJpegBuffer.toString("base64"),
    }
  );
  assert.equal(res.statusCode, 200);
  const data = JSON.parse(res.body);
  assert.equal(data.success, true);
  assert.ok(data.filename.endsWith(".jpg"), "File extension must be derived from verified image format, not client name");

  // Fetch the uploaded photo and verify security headers
  const photoRes = await request(app, { path: `/uploads/${data.filename}` });
  assert.equal(photoRes.statusCode, 200);
  assert.equal(photoRes.headers["x-content-type-options"], "nosniff");
  assert.ok(photoRes.headers["content-security-policy"].includes("default-src 'none'"));
});

test("12. Trust proxy is configured on Express instance", () => {
  assert.equal(app.get("trust proxy"), 1);
});
