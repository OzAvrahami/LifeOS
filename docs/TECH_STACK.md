# LifeOS — Technical Stack

## מטרת המסמך

המסמך מגדיר את הארכיטקטורה הטכנית של LifeOS עבור גרסה 0.1 ואת הגבולות בין ה־Client, ה־API ו־Supabase.

הבחירות נועדו לתמוך ב:

* מוצר Mobile-first
* iOS כיעד ראשון ו־Android כיעד שני
* Web כערוץ גישה אמיתי בעתיד
* Business logic במקום מרכזי אחד
* הפרדת נתוני משתמשים באמצעות Supabase Auth ו־Row Level Security
* בסיס קוד קטן שאפשר להרחיב לפי צורך אמיתי

---

# 1. Target Platforms

סדר העדיפויות של המוצר:

```text
1. iOS phone
2. Android phone
3. Tablet
4. Web / Desktop
```

כל החלטת UI ו־UX נבחנת קודם כל על מסך טלפון.

Web הוא יעד עתידי אמיתי, אך אינו יעד העיצוב הראשי של v0.1. בשלב זה לא קיימת אפליקציית Web נפרדת; Expo יכולה לספק גישת Web ראשונית, ורק צורך מוצרי אמיתי יצדיק בעתיד `apps/web` נפרד.

> LifeOS is mobile-first, not mobile-compatible.

---

# 2. Repository Architecture

LifeOS מנוהלת כ־npm workspaces monorepo קטן:

```text
lifeOS/
├── apps/
│   ├── mobile/   Expo / React Native client
│   └── api/      Node.js / Express REST API
├── supabase/     future migrations and database-owned artifacts
├── docs/         product and architecture documentation
├── package.json
└── package-lock.json
```

לא נוסיף monorepo framework נוסף, `apps/web` או `packages/` לפני שקיים צורך ממשי.

---

# 3. Client

ה־Client הראשי נמצא ב־`apps/mobile` ומשתמש ב:

```text
Expo
React Native
TypeScript
Expo Router
```

Expo Router מנהל File-based routing מתוך:

```text
apps/mobile/src/app/
```

התשתית הראשונית משתמשת ב־Expo SDK 57. מאחר שגרסת Expo Go הזמינה ב־App Store אינה תומכת כרגע ב־SDK הזה, פיתוח על iPhone פיזי יתבצע באמצעות Development Build ולא באמצעות downgrade של הפרויקט.

---

# 4. Server

ה־API נמצא ב־`apps/api` ומשתמש ב:

```text
Node.js
Express
TypeScript
REST
```

השרת הוא המקום המרכזי עבור:

* Business logic
* validation של פעולות מוצר
* orchestration של תהליכי Today / Week / Inbox בעתיד
* גישה רגילה לנתוני המוצר
* גבולות authorization נוספים מעבר ל־RLS כאשר נדרשים

לא ניצור שכבות Controller / Service / Repository לפני שקיימת לוגיקה שמצדיקה אותן.

---

# 5. Request Flow

זרימת הנתונים העסקית:

```text
Mobile / future Web
        │
        │ REST API
        ▼
Node.js + Express + TypeScript
        │
        ▼
Supabase / PostgreSQL
```

מסכי המוצר לא יבצעו ישירות פעולות כגון:

```ts
supabase.from('tasks')
```

פעולות Business Data יעברו דרך ה־Node API. כך אותה לוגיקה תשרת את Mobile ואת Web בעתיד.

---

# 6. Database

מסד הנתונים יהיה PostgreSQL באמצעות Supabase.

מודל הדומיין ייגזר מ:

```text
docs/DATA_MODEL_V0.1.md
```

המסמך מגדיר את הדומיין ללא תלות בפרוטוקול REST או במבנה ה־Client.

הספרייה `supabase/` תהיה הבעלים של migrations, seed data, database configuration ו־functions אם וכאשר יתווספו. ב־foundation הנוכחי לא נוצרת schema ולא נוצרים migrations פיקטיביים.

---

# 7. Authentication

Authentication מתבסס על Supabase Auth.

ה־Client רשאי ומיועד להתחבר ישירות ל־Supabase Auth עבור Sign in, Sign out וניהול session.

זרימת האימות:

```text
Mobile / future Web
        │ login
        ▼
Supabase Auth
        │ access token
        ▼
Client
        │ Authorization: Bearer <access-token>
        ▼
Node API
        │ verified authenticated context
        ▼
Supabase / PostgreSQL
```

ה־API לא סומך על decode ידני של JWT. הוא מאמת את ה־access token באמצעות API נתמך של Supabase ומקבל משתמש מאומת.

---

# 8. Server-side Supabase and RLS

עבור פעולות משתמש רגילות, ה־API יוצר Supabase client עם:

* Supabase publishable key
* ה־access token של המשתמש ב־`Authorization` header

כך בקשות עתידיות ל־Supabase פועלות בהקשר המשתמש ו־Row Level Security נשארת משמעותית.

כל טבלה השייכת למשתמש תכלול קשר ל־`user_id`, ו־RLS policies יגבילו גישה לנתונים המותרים למשתמש המאומת.

אין צורך ב־service-role או secret key בתשתית הנוכחית.

כללים סגורים:

* service-role או Supabase secret key לעולם לא יישמרו ב־Client.
* אין להוסיף key שעוקף RLS ללא צורך server-side קונקרטי ובדיקה מפורשת.
* Direct Client → Supabase Auth מותר ומיועד.
* Direct Client → Supabase table CRUD אינו ארכיטקטורת ה־Business Data של LifeOS.

---

# 9. Server State and Local State

TanStack Query מנהלת Server State ב־Client:

```text
fetching
loading
errors
caching
refetching
mutations
cache invalidation
```

ה־queries וה־mutations העתידיים יקראו ל־LifeOS REST API ולא ישירות לטבלאות Supabase.

State מקומי יישאר ב־React באמצעות:

```text
useState
useReducer
Context
```

לא נוסיף Redux, Zustand או Global State Library אחרת בלי צורך ממשי.

---

# 10. Styling and Interaction

ה־UI יתבסס על:

```text
React Native StyleSheet
Custom Design Tokens
```

לא נכניס כרגע UI framework שמכתיב את העיצוב.

האינטראקציה מתוכננת עבור Touch, שימוש ביד אחת ככל האפשר, Quick Capture, ניווט פשוט ומינימום הקלדה.

---

# 11. Testing

בדיקות ה־Mobile מבוססות על:

```text
Jest
jest-expo
React Native Testing Library
```

בדיקות ה־API משתמשות ב־Node test runner וב־Supertest עבור התנהגות HTTP של Express.

לא נקים E2E מלא לפני שקיים Flow מוצרי אמיתי.

---

# 12. Environment Configuration

ל־Mobile ול־API יש קובצי environment example נפרדים.

Mobile:

```text
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY
EXPO_PUBLIC_API_URL
```

API:

```text
SUPABASE_URL
SUPABASE_PUBLISHABLE_KEY
PORT
```

ה־publishable key הוא public client key עם הרשאות נמוכות ואינו secret. למרות זאת, גישה לנתונים עדיין דורשת policies נכונות ו־access token של משתמש.

קובצי `.env` מקומיים אינם נשמרים ב־Git. Credentials לא ייכתבו ישירות בקוד.

---

# 13. Offline, Notifications and Analytics

LifeOS אינה Offline-first ב־v0.1. Full offline synchronization, Push Notifications ו־Product Analytics מורכב אינם חלק מהתשתית הראשונית וייבחנו לפי שימוש אמיתי.

---

# Stack Summary

```text
LifeOS
├── Client
│   ├── Expo
│   ├── React Native
│   ├── TypeScript
│   ├── Expo Router
│   └── TanStack Query
├── Server
│   ├── Node.js
│   ├── Express
│   ├── TypeScript
│   └── REST API
├── Data and Auth
│   ├── Supabase PostgreSQL
│   ├── Supabase Auth
│   └── Row Level Security
├── UI
│   ├── React Native StyleSheet
│   └── Custom Design Tokens
└── Testing
    ├── Jest / jest-expo / RNTL
    └── Node test runner / Supertest
```

---

# דברים שבכוונה אינם ב־Stack v0.1

```text
Separate Web application
NestJS
GraphQL
Prisma
Redux
Zustand
Tailwind CSS
Turborepo
Nx
Microservices
Service-role data access
Full Offline Sync
```

---

# החלטות סגורות

* LifeOS היא Mobile-first ו־Web הוא ערוץ גישה עתידי.
* Expo / React Native / TypeScript / Expo Router הם בסיס ה־Client.
* Node.js / Express / TypeScript / REST הם בסיס ה־API.
* Business logic וגישה רגילה לנתוני המוצר חיים ב־API.
* Supabase PostgreSQL היא שכבת הנתונים.
* Supabase Auth מנהל Authentication.
* ה־Client מתחבר ישירות ל־Supabase רק עבור Auth/session, לא עבור Business Data CRUD.
* ה־API מאמת Bearer tokens ומעביר access token מאומת ל־Supabase עבור RLS.
* אין service-role או secret key בתשתית הנוכחית.
* TanStack Query מנהלת Server State ו־React מנהלת Local UI State.
* אין Global State Library בשלב הראשון.
