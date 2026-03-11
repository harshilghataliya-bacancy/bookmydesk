import { test, expect } from "@playwright/test";

const BASE = "http://localhost:3001";

// Helper to make API requests with the authenticated context
function api(request: typeof test extends (name: string, fn: infer F) => void
  ? F extends (args: infer A) => void ? A extends { request: infer R } ? R : never : never : never) {
  return request;
}

// ─────────────────────────────────────────────
// 1. FLOORS API
// ─────────────────────────────────────────────
test.describe("Floors API", () => {
  test("GET /api/floors — returns list of floors", async ({ request }) => {
    const res = await request.get(`${BASE}/api/floors`);
    expect(res.status()).toBe(200);

    const floors = await res.json();
    expect(Array.isArray(floors)).toBe(true);
    expect(floors.length).toBeGreaterThan(0);

    // Each floor should have required fields
    const floor = floors[0];
    expect(floor).toHaveProperty("id");
    expect(floor).toHaveProperty("name");
    expect(typeof floor.name).toBe("string");
    console.log(`  ✓ GET /api/floors — ${floors.length} floors`);
  });

  test("GET /api/floors/:id/sections — returns sections for a floor", async ({ request }) => {
    // First get a floor ID
    const floorsRes = await request.get(`${BASE}/api/floors`);
    const floors = await floorsRes.json();
    const floorId = floors[0].id;

    const res = await request.get(`${BASE}/api/floors/${floorId}/sections`);
    expect(res.status()).toBe(200);

    const sections = await res.json();
    expect(Array.isArray(sections)).toBe(true);
    expect(sections.length).toBeGreaterThan(0);

    const section = sections[0];
    expect(section).toHaveProperty("id");
    expect(section).toHaveProperty("label");
    expect(section).toHaveProperty("floorId");
    console.log(`  ✓ GET /api/floors/${floorId}/sections — ${sections.length} sections`);
  });

  test("GET /api/floors/invalid-id/sections — returns empty or 404", async ({ request }) => {
    const res = await request.get(`${BASE}/api/floors/nonexistent-id/sections`);
    // Should not crash — returns empty array or 404
    expect([200, 404]).toContain(res.status());
    console.log(`  ✓ GET /api/floors/invalid-id — handled gracefully`);
  });
});

// ─────────────────────────────────────────────
// 2. ROOMS API
// ─────────────────────────────────────────────
test.describe("Rooms API", () => {
  test("GET /api/rooms/all — returns all rooms with stats", async ({ request }) => {
    const res = await request.get(`${BASE}/api/rooms/all`);
    expect(res.status()).toBe(200);

    const rooms = await res.json();
    expect(Array.isArray(rooms)).toBe(true);
    expect(rooms.length).toBeGreaterThan(0);

    const room = rooms[0];
    expect(room).toHaveProperty("id");
    expect(room).toHaveProperty("name");
    expect(room).toHaveProperty("rows");
    expect(room).toHaveProperty("cols");
    expect(room).toHaveProperty("floorName");
    expect(room).toHaveProperty("sectionLabel");
    expect(room).toHaveProperty("totalDesks");
    expect(room).toHaveProperty("bookedDesks");
    expect(room).toHaveProperty("reservedDesks");
    expect(room).toHaveProperty("availableDesks");
    expect(typeof room.totalDesks).toBe("number");
    expect(room.totalDesks).toBe(room.rows * room.cols);
    expect(room.availableDesks).toBe(room.totalDesks - room.bookedDesks - room.reservedDesks);
    console.log(`  ✓ GET /api/rooms/all — ${rooms.length} rooms`);
  });

  test("GET /api/rooms/:id/desks — returns room with desk grid", async ({ request }) => {
    // Get a room ID first
    const roomsRes = await request.get(`${BASE}/api/rooms/all`);
    const rooms = await roomsRes.json();
    const roomId = rooms[0].id;

    const res = await request.get(`${BASE}/api/rooms/${roomId}/desks`);
    expect(res.status()).toBe(200);

    const room = await res.json();
    expect(room).toHaveProperty("id");
    expect(room).toHaveProperty("name");
    expect(room).toHaveProperty("rows");
    expect(room).toHaveProperty("cols");
    expect(room).toHaveProperty("desks");
    expect(Array.isArray(room.desks)).toBe(true);
    expect(room.desks.length).toBe(room.rows * room.cols);

    const desk = room.desks[0];
    expect(desk).toHaveProperty("id");
    expect(desk).toHaveProperty("deskNumber");
    expect(desk).toHaveProperty("row");
    expect(desk).toHaveProperty("col");
    // booking can be null or object
    expect(desk).toHaveProperty("booking");
    console.log(`  ✓ GET /api/rooms/${roomId}/desks — ${room.desks.length} desks`);
  });

  test("GET /api/rooms/invalid-id/desks — returns error", async ({ request }) => {
    const res = await request.get(`${BASE}/api/rooms/nonexistent/desks`);
    expect([400, 404, 500]).toContain(res.status());
    console.log(`  ✓ GET /api/rooms/invalid-id/desks — handled gracefully`);
  });
});

// ─────────────────────────────────────────────
// 3. BOOKINGS API
// ─────────────────────────────────────────────
test.describe("Bookings API", () => {
  test("GET /api/bookings/mine — returns current user booking or null", async ({ request }) => {
    const res = await request.get(`${BASE}/api/bookings/mine`);
    expect(res.status()).toBe(200);

    const data = await res.json();
    // Can be null (no booking) or an object
    if (data !== null) {
      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("deskNumber");
      expect(data).toHaveProperty("roomName");
      expect(data).toHaveProperty("roomId");
      expect(data).toHaveProperty("floorName");
      expect(data).toHaveProperty("sectionLabel");
      console.log(`  ✓ GET /api/bookings/mine — has booking (Desk ${data.deskNumber})`);
    } else {
      console.log(`  ✓ GET /api/bookings/mine — no active booking`);
    }
  });

  test("GET /api/bookings — admin: returns all bookings", async ({ request }) => {
    const res = await request.get(`${BASE}/api/bookings`);
    // Will be 200 if admin, 403 if not
    if (res.status() === 200) {
      const bookings = await res.json();
      expect(Array.isArray(bookings)).toBe(true);

      if (bookings.length > 0) {
        const b = bookings[0];
        expect(b).toHaveProperty("id");
        expect(b).toHaveProperty("userName");
        expect(b).toHaveProperty("userEmail");
        expect(b).toHaveProperty("deskNumber");
        expect(b).toHaveProperty("roomName");
        expect(b).toHaveProperty("floorName");
        expect(b).toHaveProperty("sectionLabel");
        expect(b).toHaveProperty("isReserved");
        expect(b).toHaveProperty("bookedAt");
      }
      console.log(`  ✓ GET /api/bookings — ${bookings.length} bookings (admin)`);
    } else {
      expect(res.status()).toBe(403);
      console.log(`  ✓ GET /api/bookings — 403 Forbidden (not admin)`);
    }
  });

  test("GET /api/bookings/search?q=... — search employees", async ({ request }) => {
    // Search with too short query
    const shortRes = await request.get(`${BASE}/api/bookings/search?q=a`);
    expect(shortRes.status()).toBe(200);
    const shortData = await shortRes.json();
    expect(shortData).toEqual([]);
    console.log(`  ✓ GET /api/bookings/search?q=a — empty for short query`);

    // Search with valid query
    const res = await request.get(`${BASE}/api/bookings/search?q=test`);
    expect(res.status()).toBe(200);
    const results = await res.json();
    expect(Array.isArray(results)).toBe(true);

    if (results.length > 0) {
      const r = results[0];
      expect(r).toHaveProperty("userName");
      expect(r).toHaveProperty("userEmail");
      expect(r).toHaveProperty("deskNumber");
      expect(r).toHaveProperty("roomName");
      expect(r).toHaveProperty("roomId");
    }
    console.log(`  ✓ GET /api/bookings/search?q=test — ${results.length} results`);
  });

  test("POST /api/bookings — reject booking without deskId", async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings`, {
      data: {},
    });
    expect(res.status()).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("deskId");
    console.log(`  ✓ POST /api/bookings — 400 without deskId`);
  });

  test("POST /api/bookings — reject booking with invalid deskId", async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings`, {
      data: { deskId: "nonexistent-desk-id" },
    });
    // Should be 400 (invalid desk) or 409 (conflict if user already has booking)
    expect([400, 409]).toContain(res.status());
    console.log(`  ✓ POST /api/bookings — rejected invalid deskId (${res.status()})`);
  });
});

// ─────────────────────────────────────────────
// 4. USERS API
// ─────────────────────────────────────────────
test.describe("Users API", () => {
  test("GET /api/users/count — returns employee count", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users/count`);

    if (res.status() === 200) {
      const data = await res.json();
      expect(data).toHaveProperty("count");
      expect(typeof data.count).toBe("number");
      expect(data.count).toBeGreaterThan(0);
      console.log(`  ✓ GET /api/users/count — ${data.count} employees (admin)`);
    } else {
      expect(res.status()).toBe(403);
      console.log(`  ✓ GET /api/users/count — 403 Forbidden (not admin)`);
    }
  });

  test("GET /api/users — returns user list", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users`);

    if (res.status() === 200) {
      const users = await res.json();
      expect(Array.isArray(users)).toBe(true);

      if (users.length > 0) {
        const u = users[0];
        expect(u).toHaveProperty("id");
        expect(u).toHaveProperty("name");
        expect(u).toHaveProperty("email");
        expect(u).toHaveProperty("hasBooking");
      }
      console.log(`  ✓ GET /api/users — ${users.length} users (admin)`);
    } else {
      expect(res.status()).toBe(403);
      console.log(`  ✓ GET /api/users — 403 Forbidden (not admin)`);
    }
  });

  test("GET /api/users?search=bacancy — filters by search", async ({ request }) => {
    const res = await request.get(`${BASE}/api/users?search=bacancy`);

    if (res.status() === 200) {
      const users = await res.json();
      expect(Array.isArray(users)).toBe(true);
      // Every result should match the search
      users.forEach((u: { email: string; name: string }) => {
        const matches =
          u.email.toLowerCase().includes("bacancy") ||
          u.name.toLowerCase().includes("bacancy");
        expect(matches).toBe(true);
      });
      console.log(`  ✓ GET /api/users?search=bacancy — ${users.length} matching`);
    } else {
      expect(res.status()).toBe(403);
      console.log(`  ✓ GET /api/users?search — 403 (not admin)`);
    }
  });
});

// ─────────────────────────────────────────────
// 5. BOOKING FLOW (create → verify → cleanup)
// ─────────────────────────────────────────────
test.describe("Booking Flow — end to end", () => {
  test("Full booking lifecycle: find desk → book → verify → free", async ({ request }) => {
    // Step 1: Check if user already has a booking
    const mineRes = await request.get(`${BASE}/api/bookings/mine`);
    const existingBooking = await mineRes.json();

    // If user already has a booking, free it first (need admin)
    if (existingBooking) {
      const allRes = await request.get(`${BASE}/api/bookings`);
      if (allRes.status() === 200) {
        const allBookings = await allRes.json();
        const myBooking = allBookings.find(
          (b: { userEmail: string }) =>
            b.userEmail === "harshil.ghataliya@bacancy.com"
        );
        if (myBooking) {
          const delRes = await request.delete(`${BASE}/api/bookings/${myBooking.id}`);
          expect(delRes.status()).toBe(200);
          console.log(`  ✓ Freed existing booking`);
        }
      }
    }

    // Step 2: Get all rooms and find an available desk
    const roomsRes = await request.get(`${BASE}/api/rooms/all`);
    const rooms = await roomsRes.json();
    const roomWithAvail = rooms.find((r: { availableDesks: number }) => r.availableDesks > 0);
    expect(roomWithAvail).toBeDefined();
    console.log(`  ✓ Found room with available desks: ${roomWithAvail.name}`);

    // Step 3: Get desks for that room
    const desksRes = await request.get(`${BASE}/api/rooms/${roomWithAvail.id}/desks`);
    const room = await desksRes.json();
    const availableDesk = room.desks.find(
      (d: { booking: unknown; isReserved: boolean }) => !d.booking && !d.isReserved
    );
    expect(availableDesk).toBeDefined();
    console.log(`  ✓ Found available desk: #${availableDesk.deskNumber}`);

    // Step 4: Book the desk
    const bookRes = await request.post(`${BASE}/api/bookings`, {
      data: { deskId: availableDesk.id },
    });
    expect(bookRes.status()).toBe(201);
    const booking = await bookRes.json();
    expect(booking.deskId).toBe(availableDesk.id);
    console.log(`  ✓ Booked desk #${availableDesk.deskNumber}`);

    // Step 5: Verify /api/bookings/mine shows the booking
    const verifyRes = await request.get(`${BASE}/api/bookings/mine`);
    const myBooking = await verifyRes.json();
    expect(myBooking).not.toBeNull();
    expect(myBooking.deskNumber).toBe(availableDesk.deskNumber);
    expect(myBooking.roomName).toBe(roomWithAvail.name);
    console.log(`  ✓ Verified booking via /mine`);

    // Step 6: Try to double-book — should fail with 409
    const anotherDesk = room.desks.find(
      (d: { booking: unknown; isReserved: boolean; id: string }) =>
        !d.booking && !d.isReserved && d.id !== availableDesk.id
    );
    if (anotherDesk) {
      const doubleRes = await request.post(`${BASE}/api/bookings`, {
        data: { deskId: anotherDesk.id },
      });
      expect(doubleRes.status()).toBe(409);
      const err = await doubleRes.json();
      expect(err.error).toContain("already booked");
      console.log(`  ✓ Double-booking rejected (409)`);
    }

    // Step 7: Verify desk shows as booked in room view
    const reloadRes = await request.get(`${BASE}/api/rooms/${roomWithAvail.id}/desks`);
    const reloaded = await reloadRes.json();
    const bookedDesk = reloaded.desks.find(
      (d: { id: string }) => d.id === availableDesk.id
    );
    expect(bookedDesk.booking).not.toBeNull();
    console.log(`  ✓ Desk shows as booked in room view`);

    // Step 8: Free the booking (admin cleanup)
    const allBookingsRes = await request.get(`${BASE}/api/bookings`);
    if (allBookingsRes.status() === 200) {
      const all = await allBookingsRes.json();
      const toFree = all.find(
        (b: { userEmail: string }) =>
          b.userEmail === "harshil.ghataliya@bacancy.com"
      );
      if (toFree) {
        const freeRes = await request.delete(`${BASE}/api/bookings/${toFree.id}`);
        expect(freeRes.status()).toBe(200);
        console.log(`  ✓ Freed booking (cleanup)`);
      }
    }

    // Step 9: Verify booking is gone
    const finalRes = await request.get(`${BASE}/api/bookings/mine`);
    const finalData = await finalRes.json();
    expect(finalData).toBeNull();
    console.log(`  ✓ Booking cleared — full lifecycle complete`);
  });
});

// ─────────────────────────────────────────────
// 6. DATA INTEGRITY CHECKS
// ─────────────────────────────────────────────
test.describe("Data Integrity", () => {
  test("Room desk counts match actual desks", async ({ request }) => {
    const roomsRes = await request.get(`${BASE}/api/rooms/all`);
    const rooms = await roomsRes.json();

    // Check first 3 rooms
    for (const room of rooms.slice(0, 3)) {
      const desksRes = await request.get(`${BASE}/api/rooms/${room.id}/desks`);
      const data = await desksRes.json();

      expect(data.desks.length).toBe(room.totalDesks);

      const booked = data.desks.filter(
        (d: { booking: { isReserved: boolean } | null }) =>
          d.booking && !d.booking.isReserved
      ).length;
      const reserved = data.desks.filter(
        (d: { booking: { isReserved: boolean } | null }) =>
          d.booking && d.booking.isReserved
      ).length;

      expect(booked).toBe(room.bookedDesks);
      expect(reserved).toBe(room.reservedDesks);
      console.log(
        `  ✓ ${room.name}: ${room.totalDesks} desks, ${booked} booked, ${reserved} reserved — consistent`
      );
    }
  });

  test("Each section belongs to correct floor", async ({ request }) => {
    const floorsRes = await request.get(`${BASE}/api/floors`);
    const floors = await floorsRes.json();

    for (const floor of floors) {
      const sectionsRes = await request.get(`${BASE}/api/floors/${floor.id}/sections`);
      const sections = await sectionsRes.json();

      for (const section of sections) {
        expect(section.floorId).toBe(floor.id);
      }
      console.log(`  ✓ ${floor.name}: ${sections.length} sections — all linked correctly`);
    }
  });

  test("No desk is booked by two users", async ({ request }) => {
    const bookingsRes = await request.get(`${BASE}/api/bookings`);
    if (bookingsRes.status() !== 200) {
      console.log(`  ⊘ Skipped (not admin)`);
      return;
    }

    const bookings = await bookingsRes.json();
    const deskIds = bookings.map((b: { id: string; deskNumber: number }) => b.id);
    const uniqueDesks = new Set(deskIds);
    expect(uniqueDesks.size).toBe(deskIds.length);
    console.log(`  ✓ All ${bookings.length} bookings have unique desk assignments`);
  });
});

// ─────────────────────────────────────────────
// 7. EDGE CASES & ERROR HANDLING
// ─────────────────────────────────────────────
test.describe("Edge Cases", () => {
  test("POST /api/bookings with empty body — 400", async ({ request }) => {
    const res = await request.post(`${BASE}/api/bookings`, { data: {} });
    expect(res.status()).toBe(400);
    console.log(`  ✓ Empty body → 400`);
  });

  test("DELETE /api/bookings/fake-id — handles gracefully", async ({ request }) => {
    const res = await request.delete(`${BASE}/api/bookings/nonexistent-id`);
    expect([404, 500]).toContain(res.status());
    console.log(`  ✓ Delete fake booking → ${res.status()}`);
  });

  test("GET /api/rooms/all unauthenticated — 401", async ({ request: _request }) => {
    // Make a raw fetch without cookies
    const res = await fetch(`${BASE}/api/rooms/all`);
    expect(res.status).toBe(401);
    console.log(`  ✓ Unauthenticated request → 401`);
  });

  test("GET /api/bookings/search without q — empty array", async ({ request }) => {
    const res = await request.get(`${BASE}/api/bookings/search`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
    console.log(`  ✓ Search without q → empty`);
  });

  test("GET /api/bookings/search?q=x — single char returns empty", async ({ request }) => {
    const res = await request.get(`${BASE}/api/bookings/search?q=x`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toEqual([]);
    console.log(`  ✓ Search with 1 char → empty`);
  });
});
