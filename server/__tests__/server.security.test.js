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
