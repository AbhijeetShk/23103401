# Stage 1


## Core Actions

Before writing a single endpoint, I thought about what actually needs to happen from both the user's perspective and the system's perspective.

From the **user side**:
- See my notifications
- Know how many unread ones I have (that little badge number)
- Mark one or all as read
- Delete ones I don't care about
- Get new notifications the moment they happen, without polling

From the **system side**:
- Create a notification for a user (usually triggered by another service or event, not the user themselves)
- Deliver it in real time

That maps to these actions:

| Action | What it does |
|---|---|
| Create Notification | System pushes a new notification for a specific user |
| Get Notifications | Fetch paginated list, optionally filtered by read/unread |
| Mark as Read | Single notification |
| Mark Multiple as Read | Bulk update |
| Delete Notification | Soft delete — don't actually remove the row |
| Get Unread Count | The badge number |
| Real-time Delivery | Push to client the moment it's created |

---

## REST API Design

**Base URL:**
```
/api/v1/notifications
```

**Auth on every request:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

### 1. Create Notification

This is called internally another service fires this when something happens (order placed, result published, etc.).

```http
POST /api/v1/notifications
```

**Request Body:**
```json
{
  "userId": "23242",
  "type": "ORDER_PLACED",
  "title": "Order Confirmed",
  "message": "Your order #1234 has been placed successfully",
  "metadata": {
    "orderId": "1234"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification created",
  "data": {
    "id": "notif_101",
    "createdAt": "2026-05-08T12:00:00Z"
  }
}
```

| Status | Meaning |
|---|---|
| 201 | Created |
| 400 | Invalid input |
| 401 | Unauthorized |

---

### 2. Get Notifications

```http
GET /api/v1/notifications?page=1&limit=10&status=unread
```

| Param | Type | Description |
|---|---|---|
| page | number | Which page |
| limit | number | How many per page |
| status | string | `all` / `read` / `unread` |

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "notif_101",
        "title": "Order Confirmed",
        "message": "Your order has been placed",
        "type": "ORDER_PLACED",
        "isRead": false,
        "createdAt": "2026-05-08T12:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

### 3. Mark Single Notification as Read

```http
PATCH /api/v1/notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 4. Mark Multiple as Read

```http
PATCH /api/v1/notifications/read-all
```

**Request Body:**
```json
{
  "notificationIds": ["notif_101", "notif_102"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notifications updated"
}
```

---

### 5. Delete Notification

```http
DELETE /api/v1/notifications/:id
```



**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

### 6. Get Unread Count

```http
GET /api/v1/notifications/unread/count
```

**Response:**
```json
{
  "success": true,
  "data": {
    "unreadCount": 7
  }
}
```

---

## Notification JSON Schema

Every notification object looks like this:

```json
{
  "id": "string",
  "userId": "string",
  "type": "string",
  "title": "string",
  "message": "string",
  "metadata": {},
  "isRead": false,
  "deleted": false,
  "createdAt": "ISO Date",
  "updatedAt": "ISO Date"
}
```

---



Example route file:

```ts
import { Router } from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller";

const router = Router();

router.get("/", getNotifications);
router.patch("/:id/read", markAsRead);

export default router;
```

---

## Real-Time Notifications

 I'd use Socket.IO since it handles reconnection and fallbacks cleanly.

**Flow:**
1. User logs in
2. Frontend establishes a Socket.IO connection
3. Backend maps `socketId → userId` in memory (or Redis for multi-server)
4. When a notification is created:
   - Save to DB
   - Emit the event directly to that user's socket

**Server:**
```ts
io.to(userSocketId).emit("notification", {
  title: "Order Confirmed",
  message: "Your order was placed successfully"
});
```

**Client:**
```ts
socket.on("notification", (data) => {
  console.log(data);
});
```

---

## Security Checklist
Unauthorized access with JWT on every route via middleware

Spam notifications with rate limiting on create endpoint
Invalid payloads with Zod validation before hitting service layer

---

# Stage 2

# Database Design

## Why PostgreSQL?

We can use MongoDB could work for flexible schemas, but notifications have a fixed, predictable shape. But relational has benefits
PostgreSQL made sense because:


Fixed schema | Notifications don't need dynamic fields 
ACID compliance | Read/unread state updates need to be reliable 
Strong indexing | We'll be filtering by userId and isRead constantly 
Pagination support | `LIMIT/OFFSET` and cursor-based both work well 
Scalability | Table partitioning and indexing can carry us far 

---

## Schema

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    metadata JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Indexes

These three are the minimum I'd add initially:

```sql
CREATE INDEX idx_notifications_user_id
ON notifications(user_id);

CREATE INDEX idx_notifications_is_read
ON notifications(is_read);

CREATE INDEX idx_notifications_created_at
ON notifications(created_at DESC);
```

---

## Queries Mapped to API Endpoints

**Create Notification:**
```sql
INSERT INTO notifications (id, user_id, type, title, message, metadata)
VALUES (
    gen_random_uuid(),
    'user_101',
    'ORDER_PLACED',
    'Order Confirmed',
    'Your order was placed',
    '{"orderId": "1234"}'
);
```

**Fetch Notifications (paginated, non-deleted):**
```sql
SELECT *
FROM notifications
WHERE user_id = 'user_101'
AND deleted = false
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

**Mark as Read:**
```sql
UPDATE notifications
SET is_read = true, updated_at = CURRENT_TIMESTAMP
WHERE id = 'notif_101';
```

**Soft Delete:**
```sql
UPDATE notifications
SET deleted = true
WHERE id = 'notif_101';
```

**Unread Count:**
```sql
SELECT COUNT(*)
FROM notifications
WHERE user_id = 'user_101'
AND is_read = false
AND deleted = false;
```

---

## Problems That Appear as Data Grows


Slow queries when full table scans on millions of rows which can be solved using composite indexing which I will cover in stage 3
Expensive COUNT can be resolved by using `COUNT(*)`. We can use cursor-based pagination 

```sql
WHERE created_at < :last_seen_timestamp
LIMIT 20
```
Socket overload - partition by `created_at` monthly or by `user_id` range so queries only operate on relevant partitions
Storage bloat - Soft deletes accumulate dead rows over time - cache unread counts and recent notifications (can use redis here)
Pagination slowdown - We can use kafka for high-throughput create operations. Instead of writing synchronously. Queue the job, let a worker handle the insert

---



# Stage 3

# Query Analysis and Optimization

## Is it logically correct?

Yes it filters by student, filters unread, sorts oldest first.

## Why is it slow at 5M rows?

Three issues:

**1. `SELECT *`**

Pulling every column even when the frontend probably only needs `id`, `title`, `message`, `createdAt`. 
**2. No composite index**

The query uses `studentID` and `isRead` as filters and `createdAt` for sorting. The DB has to scan a large chunk of the table and then sort in memory which both are expensive at this scale.

**3. Sorting is expensive**

`ORDER BY createdAt ASC` on millions of unfiltered rows.

---

## Improved Query

```sql
SELECT id, title, message, createdAt
FROM notifications
WHERE studentID = 1042
AND isRead = false
ORDER BY createdAt DESC
LIMIT 20;
```


 Selected specific columns -Less data moved, faster response
| `LIMIT 20` -Don't load thousands of rows at once
| `DESC` ordering -Latest notifications are what users actually want first

---

## Enhanced Index

```sql
CREATE INDEX idx_notifications_student_read_created
ON notifications(studentID, isRead, createdAt DESC);
```

With this the db can:
1. Jump straight to the student rows
2. Filter isRead without scanning everything
3. Return rows already sorted — no extra sort step needed

**Without index:** O(n) scanning a big portion of the table.
**With composite index:** O(log n) for the lookup + a small sequential scan for the result set.

---

## Should You Add Indexes on Every Column?

No. 


Storage overhead, issues is every index is a copy of data, takes space
Slower writes issue is every `INSERT` and `UPDATE` has to update all indexes
Query planner confusion- too many indexes can lead the planner to make bad choices
Unused indexes-mostly never get used


---

## Query: Students Who Got Placement Notifications in Last 7 Days

```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
AND createdAt >= NOW() - INTERVAL '7 days';
```

**Index for this query:**
```sql
CREATE INDEX idx_notifications_type_created
ON notifications(notificationType, createdAt DESC);
```

---
# Stage 4

## Reducing DB Load on Notification Fetch

Currently every page load sends a `GET /notifications` request.  
If thousands of students are active together, the database keeps getting hit again and again for almost the same data.

First thing I would do is pagination. Instead of sending all notifications together, only send recent ones.

```sql
SELECT id, title, message, createdAt
FROM notifications
WHERE studentID = 1042
ORDER BY createdAt DESC
LIMIT 20;
```

This reduces response size, DB load and frontend rendering time.  
The only extra work is adding "load more" or infinite scroll on frontend.

Next, I would add Redis caching.

```txt
notifications:user:1042
TTL = 60s
```

Whenever request comes:
- check Redis first
- if data exists, return it
- otherwise fetch from DB and cache it

This avoids repeated DB hits for the same user.  
Only issue is cache invalidation when notifications update.

Another good optimization is lazy loading.  
Notifications should not load on every page refresh. They should load only when the user opens the notification panel. Most users don't even open notifications every time, so this cuts unnecessary API calls.

For real-time updates, I would use Socket.IO instead of polling APIs repeatedly.  
Server can directly push notifications to clients when created, instead of frontend calling API every few seconds.

For large notification history, OFFSET pagination becomes slow.

```sql
LIMIT 20 OFFSET 100000
```

Better approach:

```sql
WHERE createdAt < :last_seen_timestamp
LIMIT 20
```

This keeps performance consistent even for huge datasets.

Overall I would combine:
- pagination
- Redis caching
- lazy loading
- Socket.IO
- cursor pagination

Together they reduce unnecessary DB reads and improve scalability.

---

# Stage 5

## Redesigning Bulk Notification System

Original code:

```py
function notify_all(student_ids, message):
    for student_id in student_ids:
        send_email(student_id, message)
        save_to_db(student_id, message)
        push_to_app(student_id, message)
```

Main issue is everything runs sequentially.  
For 50,000 students, email sending alone can take hours.

Another problem is failure handling.  
If email sending fails midway, some students may never get notifications and there is no retry mechanism.

Also, doing one DB insert per student means 50,000 separate DB operations which is inefficient.

A better approach is separating DB persistence from notification delivery.

Database save should happen first because it is the source of truth.  
Email and push notifications can happen asynchronously.

Architecture would look like this:

```txt
HR Panel
   ↓
API Server
   ↓
Batch DB Insert
   ↓
Message Queue
   ↓
Workers
  Email Worker
 Push Worker
```

Improved pseudocode:

```py
function notify_all(student_ids, message):

    batch_insert_notifications(student_ids, message)

    for student_id in student_ids:
        queue.publish({
            "student_id": student_id,
            "message": message
        })

    return { "success": true }
```

Worker:

```py
function notification_worker(job):

    try:
        send_email(job.student_id, job.message)

    except TemporaryFailure:
        queue.retry(job)

    except PermanentFailure:
        dead_letter_queue.push(job)

    try:
        push_to_app(job.student_id, job.message)

    except:
        log_failure(job)
```

This approach is much better because:
- API responds quickly, workers handle delivery asynchronously, retries can happen automatically, failures are easier to track, DB load reduces because of batch inserts

Extra improvements can include:
email rate limiting, autoscaling workers, dashboard for failed jobs, retry monitoring

# Stage 6

For this stage, I implemented a simple Priority Notification Inbox using Express.js and TypeScript.

The notifications are fetched from the provided API and then sorted based on priority. Only the top 10 notifications are returned.

Priority is calculated using:
- notification type
- recency
- keywords present in the message

Priority order used:

```txt
Placement > Result > Event
Extra priority is also added for keywords like:

hiring
review
placement

Recent notifications are given higher priority compared to older ones.

After fetching notifications:

priority score is calculated
notifications are sorted in descending order
top 10 notifications are returned using .slice(0, 10)

To maintain the top 10 efficiently when new notifications arrive, the notifications are dynamically sorted every time the API is called. 

In larger systems, this can later be optimized using:

priority queues
Redis caching
databases