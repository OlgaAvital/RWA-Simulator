# RWA Return Simulator

סימולטור React לחישוב תשואה על RWA, על בסיס המוקאפ המקורי.

## הפעלה מקומית

1. התקן Node.js בגרסה שכוללת npm.
2. פתח מסוף בתיקיית הפרויקט.
3. התקן חבילות:

```bash
npm install
```

4. הרץ את האפליקציה:

```bash
npm run dev
```

5. פתח את הכתובת שמופיעה במסוף, בדרך כלל:

```text
http://127.0.0.1:5173
```


## Preview ופרסום ב-GitHub

הפרויקט כולל קובץ `vite.config.js` עם `base: "./"`, כדי ש־build סטטי יעבוד גם תחת נתיב Repository של GitHub Pages ולא רק בשורש דומיין.

נוסף workflow בשם `Build and publish preview`:

- בכל Pull Request נבנה `dist` ומועלה artifact בשם `rwa-simulator-dist-preview` לצורך בדיקת תוצר ה־preview.
- בכל push ל־`main` או `master` נבנה `dist` ונפרס ל־GitHub Pages, בכפוף לכך ש־Pages מוגדר ב־Repository ל־GitHub Actions.

אם GitHub מציג conflict ב־PR ישן, מומלץ לפתוח PR חדש מהענף המעודכן לאחר commit זה או לעדכן את הענף מול בסיס ה־target. בקוד המקומי אין conflict markers, וה־build רץ מהמצב הנוכחי.

## מבנה

- `src/App.jsx` - מעטפת האפליקציה, state orchestration וחיבור בין מסכים, מודלים וגרפים.
- `src/domain/simulatorEngine.js` - מנוע החישוב והקבועים העסקיים: מוצרים, עמלות, בטוחות, ערבויות, RWA ותחזית פרויקט תשתית.
- `src/components/common/index.jsx` - רכיבי UI משותפים כמו KPI, פאנלים, קלט מספרי, כפתורי לשוניות ורכיבי טבלאות בסיסיים.
- `src/components/simulator/index.jsx` - מסכי הסימולטור, פופ־אפים, מודולי פרויקט תשתית ופלטי הדפסה.
- `src/main.jsx` - נקודת הכניסה של React.
- `src/styles.css` - Tailwind ועיצוב בסיסי גלובלי.
- `package.json` - חבילות ופקודות הרצה.

## עקרונות ארכיטקטורה להמשך

- חישובים עסקיים חדשים צריכים להיכנס ל־`src/domain` ולא לקומפוננטות UI.
- קומפוננטות תצוגה צריכות לקבל קלט מחושב ולהציג אותו, בלי לשכפל לוגיקת RWA/עמלות/חשיפה.
- פופ־אפים ומסכי משנה צריכים להישאר תחת `src/components/simulator` או תיקיית feature ייעודית, ולא בתוך מעטפת האפליקציה הראשית.
- בעת מעבר עתידי ל־C# או Backend API, `src/domain/simulatorEngine.js` הוא שכבת הייחוס הראשונה לתרגום ולבדיקות תאימות.
