# LifeOS — Data Model v0.1

## מטרת המסמך

המסמך מגדיר את מודל הנתונים הראשוני של LifeOS עבור גרסה 0.1.

המטרה אינה להגדיר עדיין סכמת Database סופית או SQL.

המטרה היא להגדיר בצורה עקבית:

* אילו ישויות קיימות במערכת
* איזה מידע כל ישות מחזיקה
* כיצד משימה עוברת בין Inbox, Week, Today, Now ו־Done
* אילו נתונים נדרשים כדי לתמוך במסכי הליבה
* מה במפורש לא נבנה בשלב הראשון

המודל צריך לתמוך בזרימה המרכזית:

```text
Capture
   ↓
Inbox
   ↓
Week
   ↓
Today
   ↓
Now
   ↓
Done
```

---

# עיקרון מרכזי

## תכנון וביצוע הם שני דברים שונים

LifeOS מפרידה בין:

### מצב ביצוע

מה מצבה של המשימה מבחינת עבודה בפועל?

```text
open
in_progress
completed
cancelled
```

### מצב תכנון

איפה המשימה נמצאת מבחינת התכנון?

```text
Inbox
Week
Scheduled Day
Today
```

לכן:

> Inbox, Week ו־Today אינם statuses.

הם Views שנגזרים מנתוני התכנון של אותה משימה.

---

# 1. User

המערכת בנויה סביב משתמש, גם כאשר בגרסה הראשונה יש משתמש אחד בלבד.

## שדות

```text
id
name
email
timezone
created_at
updated_at
```

### timezone

אזור הזמן של המשתמש.

כל חישובי:

* Today
* Week
* תאריך השלמה
* התחייבויות

צריכים להתבסס על אזור הזמן של המשתמש.

---

# 2. User Settings

הגדרות בסיסיות של המשתמש יישמרו בנפרד.

```text
UserSettings

id
user_id
week_start_day
default_daily_capacity_minutes
created_at
updated_at
```

## week_start_day

מגדיר מה נחשב תחילת השבוע עבור המשתמש.

לדוגמה:

```text
Sunday
```

## default_daily_capacity_minutes

מספר הדקות שהמשתמש מעוניין להקדיש למשימות ביום רגיל.

לדוגמה:

```text
360
```

כלומר:

```text
6 hours
```

זה אינו מספר שעות העבודה הכולל של היום.

זהו זמן שהמשתמש מחשיב כזמין לתכנון משימות.

---

# 3. Task

`Task` היא הישות המרכזית ב־LifeOS.

אותה משימה נשארת אותו אובייקט לאורך כל חייה.

לדוגמה:

```text
לקבוע תור לרופא
```

יכולה לעבור:

```text
Inbox
  ↓
Week
  ↓
Monday
  ↓
Today
  ↓
Now
  ↓
Done
```

מבלי ליצור עותקים חדשים.

---

## מבנה Task

```text
Task

id
user_id

title
description

status

life_area_id
priority
estimated_minutes

due_date
planned_date
week_plan_id
position

created_at
updated_at
completed_at
```

---

## title

כותרת המשימה.

זהו השדה היחיד שהמשתמש חייב להזין בזמן Capture מהיר.

---

## description

מידע נוסף על המשימה.

אופציונלי.

---

# 4. Task Status

`status` מתאר רק את מצב הביצוע.

בגרסה 0.1:

```text
open
in_progress
completed
cancelled
```

---

## open

המשימה קיימת ועדיין לא הושלמה.

היא יכולה להיות:

* ב־Inbox
* מתוכננת לשבוע
* מתוכננת ליום מסוים

---

## in_progress

המשתמש עובד כרגע על המשימה.

זהו מצב ה־Now של LifeOS.

---

## completed

המשימה הושלמה.

במצב הזה:

```text
completed_at != null
```

---

## cancelled

המשימה כבר אינה רלוונטית, אבל אנחנו מעוניינים לשמור אותה במערכת.

מחיקה פיזית והתנהגות Archive יוגדרו בשלב הטכני.

---

# 5. Inbox

Inbox אינו טבלה ואינו status.

Task נמצאת ב־Inbox כאשר:

```text
status = open
planned_date = null
week_plan_id = null
```

לדוגמה:

```text
title: "לקבוע טיפול לרכב"

status: open
planned_date: null
week_plan_id: null
```

המשמעות:

> המשימה קיימת, אבל עדיין לא התקבלה החלטה מתי לבצע אותה.

---

# 6. Planned Date

```text
planned_date
```

מייצג:

> באיזה יום אני מתכוון לבצע את המשימה?

לדוגמה:

```text
2026-08-10
```

כאשר קיים `planned_date`, המשימה משויכת לאותו יום.

אין צורך לשמור במקביל גם את השבוע שלה.

את השבוע ניתן להסיק מהתאריך.

---

# 7. Due Date

```text
due_date
```

מייצג:

> עד מתי המשימה חייבת להסתיים?

זה שונה לחלוטין מ־`planned_date`.

לדוגמה:

```text
planned_date: 2026-08-10
due_date:     2026-08-13
```

המשמעות:

> אני מתכנן לעבוד עליה ביום שני, אבל היא חייבת להסתיים עד יום חמישי.

שני השדות אופציונליים.

---

# 8. WeekPlan

שבוע ב־LifeOS הוא תקופת תכנון.

נגדיר ישות:

```text
WeekPlan
```

## שדות

```text
id
user_id
week_start
created_at
updated_at
```

לדוגמה:

```text
week_start: 2026-08-09
```

אין צורך לשמור:

```text
week_end
```

מכיוון שניתן לחשב אותו על בסיס `week_start`.

---

# 9. משימה ששייכת לשבוע ללא יום

Task יכולה להשתייך לתכנון השבועי ועדיין לא להיות משובצת ליום.

במקרה כזה:

```text
status = open
planned_date = null
week_plan_id != null
```

לדוגמה:

```text
title: "להכין הצעת מחיר"

status: open
planned_date: null
week_plan_id: week_123
```

המשמעות:

> אני רוצה לבצע את זה השבוע, אבל עדיין לא החלטתי מתי.

---

# 10. משימה ששובצה ליום

ברגע שהמשתמש בוחר יום:

```text
planned_date = selected_date
week_plan_id = null
```

לדוגמה:

```text
planned_date: 2026-08-11
week_plan_id: null
```

אין צורך לשמור גם `week_plan_id`, משום שהשבוע נגזר מהתאריך.

מסך Week יציג יחד:

1. Tasks עם `planned_date` שנמצא בתוך טווח השבוע.
2. Tasks עם `week_plan_id` של אותו WeekPlan.

---

# 11. Today

Today אינו אובייקט נפרד ואינו status.

מסך Today לתאריך מסוים מציג Tasks שעבורן:

```text
planned_date = selected_date
```

כאשר התאריך הוא היום:

```text
planned_date = today
```

המשימה מופיעה במסך Today.

---

# 12. Position

Task כוללת:

```text
position
```

השדה משמש לסידור משימות בתוך הקונטקסט שבו הן מוצגות.

לדוגמה:

```text
1
2
3
4
```

בגרסה 0.1 אין צורך במנגנון Ordering מורכב.

כאשר משתמש מזיז משימות, LifeOS יכולה לעדכן את הערכים בהתאם.

המימוש המדויק ייקבע בזמן בניית ה־Database.

---

# 13. Priority

Task יכולה לקבל רמת חשיבות.

בגרסה הראשונה:

```text
normal
important
```

ברירת המחדל:

```text
normal
```

המטרה היא לא להכריח את המשתמש להחליט בין רמות רבות עבור כל משימה.

אם במהלך השימוש נראה שחסרה רמת עדיפות נוספת, נוכל להוסיף אותה.

---

# 14. Estimated Duration

Task יכולה לכלול:

```text
estimated_minutes
```

לדוגמה:

```text
15
30
60
90
```

השדה אופציונלי.

אם קיים ערך, הוא משמש לחישוב עומס היום.

משימה יכולה להיווצר בלי הערכת זמן.

---

# 15. LifeArea

Task יכולה להשתייך לתחום בחיים.

נגדיר:

```text
LifeArea
```

## שדות

```text
id
user_id
name
position
is_active
created_at
updated_at
```

תחומים התחלתיים אפשריים:

```text
עבודה
משפחה
בית
בריאות
אישי
פרויקטים
```

המשתמש אינו חייב לבחור Life Area בזמן יצירת המשימה.

---

# 16. DailyPlan

מסך Today מכיל מידע ששייך ליום עצמו ולא למשימה מסוימת.

לכן נגדיר:

```text
DailyPlan
```

## שדות

```text
id
user_id
date
focus_task_id
available_minutes
created_at
updated_at
```

---

## focus_task_id

המשימה שהמשתמש בחר כמיקוד המרכזי של היום.

היא חייבת להיות Task של אותו משתמש.

בגרסה הראשונה ניתן לבחור לכל היותר מיקוד מרכזי אחד ביום.

---

## available_minutes

מאפשר למשתמש להגדיר Capacity שונה ליום מסוים.

לדוגמה:

ביום רגיל:

```text
default_daily_capacity_minutes = 360
```

אבל ביום עמוס:

```text
available_minutes = 180
```

---

## מתי נוצר DailyPlan?

לא יוצרים DailyPlan לכל תאריך באופן אוטומטי.

אם אין ליום הגדרה מיוחדת, LifeOS משתמשת בברירות המחדל.

DailyPlan נוצר רק כאשר יש מידע ייחודי ליום, לדוגמה:

* המשתמש בחר Focus
* שינה את הזמן הזמין

---

# 17. Now — Active Task

Task שנמצאת כרגע בביצוע מקבלת:

```text
status = in_progress
```

הכלל בגרסה הראשונה:

> לכל משתמש יכולה להיות לכל היותר Task אחת במצב `in_progress`.

לדוגמה:

```text
לעבוד על LifeOS
status = in_progress
```

המשימה תופיע באזור Now במסך Today.

---

## התחלת Task חדשה כאשר קיימת Active Task

אם המשתמש מנסה להתחיל Task אחרת, LifeOS תצטרך לטפל במשימה הפעילה הקיימת.

בגרסה הראשונה ההתנהגות יכולה להיות:

```text
Pause current task
→ status = open

Start selected task
→ status = in_progress
```

אין צורך ב־Time Tracking מלא.

---

# 18. Completion

כאשר Task מושלמת:

```text
status = completed
completed_at = current_timestamp
```

היא אינה נמחקת.

היא פשוט אינה מופיעה יותר ברשימות הפתוחות.

---

# 19. Daily Review

בסוף היום המשתמש מחליט מה לעשות עם Tasks שלא הושלמו.

לא נבנה ישות `DailyReview` בגרסה 0.1.

הפעולות מעדכנות את ה־Task עצמה.

---

## העברה למחר

```text
planned_date = tomorrow
```

---

## העברה ליום אחר

```text
planned_date = selected_date
```

---

## החזרה לשבוע

```text
planned_date = null
week_plan_id = current_week_plan
```

---

## החזרה ל־Inbox

```text
status = open
planned_date = null
week_plan_id = null
```

---

## ביטול

```text
status = cancelled
```

---

# 20. WeeklyFocus

מיקוד שבועי אינו Task.

לדוגמה:

```text
לסיים את אפיון LifeOS
```

זה יכול להיות Outcome שמספר Tasks שונות מקדמות.

לכן נגדיר ישות:

```text
WeeklyFocus
```

## שדות

```text
id
week_plan_id
title
position
created_at
updated_at
```

בגרסה הראשונה:

```text
maximum 3 WeeklyFocus items per WeekPlan
```

---

## קשר בין WeeklyFocus ל־Task

בגרסה 0.1 לא ניצור קשר ישיר.

כלומר לא יהיה כרגע:

```text
weekly_focus_id
```

בתוך Task.

אם במהלך השימוש נראה שחסר לנו לדעת אילו משימות מקדמות כל Focus, נוסיף את הקשר מאוחר יותר.

---

# 21. Commitment

יש הבדל בין Task לבין משהו שקבוע לשעה מסוימת.

לדוגמה:

```text
13:30 — איסוף הילדים
17:00 — פגישה
```

לכן נגדיר ישות:

```text
Commitment
```

## שדות

```text
id
user_id

title
description

date
start_time
end_time

life_area_id

created_at
updated_at
```

במימוש הראשוני של Commitment בלבד, ועד שתיבנה ישות `LifeArea`, המטא־דאטה נשמר כמפתח אופציונלי מוגבל:

```text
life_area: work | family | home | health | personal | projects
```

זהו ייצוג זמני ומוגבל של תחום החיים עבור Commitments, ולא תחליף לישות `LifeArea` העתידית. Tasks אינן משתמשות בייצוג הזה.

---

## למה Commitment נפרד מ־Task?

Task אומרת:

> משהו שאני צריך לבצע.

Commitment אומרת:

> זמן שכבר תפוס עבור משהו שקבוע מראש.

ההפרדה חשובה לחישוב Capacity.

---

# 22. Commitment בגרסה 0.1

Commitment היא חד־פעמית בלבד.

לא נבנה כרגע:

```text
recurrence
repeat_rule
series_id
```

Recurring Events יישקלו בגרסה עתידית.

---

# 23. חישוב עומס יומי

LifeOS צריכה לדעת האם התכנון היומי נראה מציאותי.

החישוב הבסיסי יהיה:

```text
Task Load
=
sum(estimated_minutes of planned tasks)
```

בנוסף נרצה להתחשב בזמן שתפוס על ידי Commitments.

לדוגמה:

```text
Daily Capacity: 360 minutes

Tasks:
180 minutes

Commitments:
90 minutes
```

היישום המדויק של הנוסחה יוגדר בשלב הפיתוח.

בשלב המוצר מספיק לקבוע:

> גם Tasks וגם Commitments משפיעים על התמונה שמוצגת למשתמש לגבי העומס של היום.

---

# 24. היסטוריית דחיות

בגרסה 0.1 לא נבנה:

```text
TaskHistory
TaskMovement
RescheduleLog
```

אם Task עוברת מיום שני ליום שלישי:

```text
planned_date
```

פשוט מתעדכן.

לא נשמור כרגע כמה פעמים המשימה נדחתה.

אם בהמשך נראה שיש ערך אמיתי למידע הזה, נוסיף History Model.

---

# 25. מחיקה לעומת ביטול

בגרסה הראשונה נרצה להבחין עקרונית בין:

```text
Delete
```

לבין:

```text
Cancel
```

`cancelled` מתאים למשימה שהייתה אמיתית אבל כבר אין צורך לבצע אותה.

מחיקה פיזית יכולה לשמש לפריטים שנוצרו בטעות.

ההתנהגות המדויקת תוגדר בשלב הפיתוח.

---

# מודל הקשרים

```text
User
 │
 ├── UserSettings
 │
 ├── Tasks
 │     │
 │     └── LifeArea
 │
 ├── LifeAreas
 │
 ├── Commitments
 │     │
 │     └── LifeArea
 │
 ├── DailyPlans
 │     │
 │     └── Focus Task
 │
 └── WeekPlans
       │
       ├── WeeklyFocus
       │
       └── Unscheduled Weekly Tasks
```

---

# מיקום Task במערכת

המיקום של Task נגזר מנתוני התכנון שלה.

## Inbox

```text
status = open
planned_date = null
week_plan_id = null
```

---

## Week — עדיין ללא יום

```text
status = open
planned_date = null
week_plan_id != null
```

---

## Scheduled Day

```text
status = open
planned_date != null
```

---

## Today

```text
status = open
planned_date = today
```

---

## Now

```text
status = in_progress
```

---

## Done

```text
status = completed
completed_at != null
```

---

# דוגמה מלאה

משתמש נזכר:

```text
לקבוע טיפול לרכב
```

## Capture

```text
title: "לקבוע טיפול לרכב"

status: open
planned_date: null
week_plan_id: null
```

המשימה נמצאת ב־Inbox.

---

## המשתמש מעביר אותה לשבוע

```text
week_plan_id: week_123
```

עכשיו היא מופיעה באזור:

```text
לתכנן השבוע
```

---

## המשתמש משבץ אותה ליום שלישי

```text
planned_date: 2026-08-11
week_plan_id: null
```

עכשיו היא מופיעה ביום שלישי.

---

## מגיע יום שלישי

מכיוון ש:

```text
planned_date = today
```

היא מופיעה במסך Today.

---

## המשתמש מתחיל אותה

```text
status = in_progress
```

היא הופכת ל־Now.

---

## המשתמש מסיים אותה

```text
status = completed
completed_at = now
```

אותה Task עברה את כל המסלול ללא יצירת עותקים.

---

# יצירת Task חדשה

יצירת משימה חייבת להישאר פשוטה.

השדה היחיד שנדרש מהמשתמש:

```text
title
```

כל השדות הבאים אופציונליים:

```text
description
life_area_id
priority
estimated_minutes
due_date
planned_date
```

כך ניתן לשמור Capture מהיר.

---

# מה לא נכנס למודל v0.1

בשלב הראשון לא נבנה:

* Recurring Tasks
* Recurring Commitments
* Subtasks
* Tags
* Projects כישות נפרדת
* Attachments
* Comments
* Collaboration
* Shared Tasks
* Task History
* Reschedule History
* Time Tracking מלא
* Notifications
* Reminders מתקדמים
* AI Metadata
* Habit Tracking
* Goals Model
* Monthly Planning
* Yearly Planning
* Notes System מלאה
* קשר בין WeeklyFocus ל־Tasks

העובדה שיכולת עשויה להיות שימושית בעתיד אינה סיבה להכניס אותה למודל עכשיו.

---

# עקרונות המודל

## 1. Task אחת נשארת Task אחת

לא מעתיקים משימות בין Inbox, Week ו־Today.

---

## 2. תכנון אינו Status

```text
open
in_progress
completed
cancelled
```

מתארים ביצוע.

```text
Inbox
Week
Today
```

נגזרים מהתכנון.

---

## 3. אין שתי אמיתות לאותו מידע

אם `planned_date` קיים, אין צורך לשמור גם את השבוע שבו התאריך נמצא.

---

## 4. Planned Date ו־Due Date הם מושגים שונים

```text
planned_date
```

עונה על:

> מתי אני רוצה לבצע?

```text
due_date
```

עונה על:

> עד מתי חייב להסתיים?

---

## 5. יצירה צריכה להיות מהירה

Task אינה טופס.

אפשר ליצור אותה עם כותרת בלבד.

---

## 6. המודל משרת את v0.1

לא בונים עכשיו Schema למוצר שאנחנו אולי נרצה בעתיד.

בונים את המודל שנדרש כדי ש־LifeOS תהיה שימושית בגרסה הראשונה.

---

# תנאי הצלחה

המודל צריך לאפשר את הזרימה:

```text
Capture
   ↓
Inbox
   ↓
Week
   ↓
Today
   ↓
Now
   ↓
Done
```

ובמקביל לתמוך ב:

* תכנון שבועי
* תכנון יומי
* מיקוד יומי
* מיקודים שבועיים
* התחייבויות
* חישוב עומס
* דחיית משימות
* החזרה ל־Inbox
* השלמת משימות

בלי כפילויות ובלי מורכבות שאינה נחוצה לגרסה הראשונה.

---

# החלטות סגורות לגרסה 0.1

* `Inbox` אינו Task status.
* Task statuses הם `open`, `in_progress`, `completed`, `cancelled`.
* Task אחת נשארת אותו אובייקט לאורך כל מחזור החיים.
* `planned_date` ו־`due_date` הם שדות שונים.
* Task שבועית ללא יום מקושרת ל־`WeekPlan`.
* כאשר Task מקבלת `planned_date`, אין צורך לשמור לה `week_plan_id`.
* `DailyPlan` נוצר רק כאשר יש מידע ייחודי ליום.
* לכל משתמש יכולה להיות לכל היותר Task פעילה אחת.
* WeeklyFocus היא ישות נפרדת.
* WeeklyFocus לא מקושרת ל־Tasks ב־v0.1.
* Commitments הם חד־פעמיים ב־v0.1.
* לא נשמרת היסטוריית דחיות ב־v0.1.
* Ordering מתחיל ממנגנון `position` פשוט.
