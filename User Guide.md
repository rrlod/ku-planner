KU STUDY PLANNER
Campus Passport / KU Life Mode added.

# KU Study Planner

An independent, ongoing planner for university students, personalized for Khalifa University. No account, name or student ID required.

## Run
Extract the ZIP and open Open KU Study Planner.html in a modern browser. Keep Open KU Study Planner.html beside the Planner Files folder. No installation is needed. Manual planning works without internet; photo reading requires internet to load the reading engine. The entire folder can also be uploaded to a static website host.

## Setup
1. Set intended study hours per week and your focus duration (10–180 minutes, in 5-minute increments). Answer whether you have days off from studying, and select the weekdays you want kept free.
2. Add regular personal activities with their times.
3. Add each weekly lecture or lab separately. Choose the first date and weekday.
4. Enter assignments, deadline dates/times, and total preparation estimates using the 0.5–40 hour scale.

The planner is ongoing. Weekly lectures and labs starting in a published teaching period stop at that semester’s last class day and skip university holidays. They do not automatically restart in the next semester: update the first date and course details for the new term. Personal activities and general study can repeat continuously. Courses starting outside known teaching dates continue until removed, as noted in the editor. Weekly edits apply to the series, and deleting a series removes all its occurrences. Completion is tracked separately for each occurrence. Assignments have a single deadline.

## Study scheduling
Choose Suggest study schedules to compare three options for the week currently displayed:
- Morning focus: Sessions up to 30 minutes, 08:00–12:00.
- Afternoon balance: Sessions up to 60 minutes, 13:00–18:00.
- Evening focus: Sessions up to 90 minutes, 17:00–21:00.

Each suggested session is capped by your focus duration as well as the option’s session length. For example, a 25-minute focus duration limits all options to sessions no longer than 25 minutes. Sessions may be shorter to fit deadlines or finish preparation. At least 15 minutes are left between sessions and around commitments; these gaps are free time rather than separate calendar entries. Existing saved sessions are not changed when you adjust focus duration. Use Review my setup to change it, then Reset study plan if you want to regenerate all study sessions. They alternate preparation between unfinished assignments, starting each round with the earliest deadline, using preparation estimates. One assignment does not need to be completed before another receives study time. Existing completed and future dated study sessions linked to a task count toward its estimate. After feasible assignment preparation, spare time can be used for general revision. Tasks that cannot fit before their deadline remain flagged as preparation still to plan. Session lengths may be shortened to fit available time.

All suggestions are capped by the weekly study goal and are for the displayed week only. They do not schedule in the past. Missing preparation estimates, overdue tasks, and preparation/goal hours that cannot fit are shown. A suggestion cannot guarantee every deadline or goal is feasible. Change your target, try another week or rhythm, or plan manually when needed.

Review the listed dates and times, then choose Use this schedule. The app only adds sessions after your selection; other plans remain. Accepted sessions are dated entries you can edit/delete. Suggesting again accounts for study sessions already on the calendar.

Alternatively choose Plan study time manually. You can link a dated session to an assignment or schedule general revision. General revision may repeat weekly; preparation linked to an assignment is scheduled by date. Manual entries are your responsibility: check for clashes and deadlines. No external calendar or notifications are used.

## Categories
Tasks are orange, lectures blue, labs purple, study time green, and personal activities rose. Text labels accompany colors.

## Managing your plan
Navigate through any week, click titles to edit, and tick completed activities. Review my setup changes survey answers and lets you manage the original setup entries. Choosing No for personal activities removes personal entries created through setup. Add more tasks at any time through Add a plan. Reminders show unfinished tasks due in the next seven days or overdue tasks while the app is open.

Export my plan downloads your answers, entries and recurring completion records as JSON. Nothing is uploaded automatically. Load KU demo week adds examples. Clear local data resets all plans for this app; exported files are unaffected.

Existing survey-version entries are retained: earlier paired weekly course/personal entries become ongoing weekly entries, and old class entries become lectures. Existing tasks without preparation estimates can be edited to add them.

## Privacy and limits
Data stays in browser local storage. Use the same device, browser profile and file location; avoid private browsing. Clearing browser data or moving the app can lose access to saved records. Others using the same browser profile can see them. Do not enter sensitive details in titles. No cloud sync, push notifications or automatic data collection.

Times follow the device’s local calendar/time zone. Each timed entry stays within one day. There are no stress questions or health assessments. The university logo does not imply official university endorsement.

## Files
- Open KU Study Planner.html: setup, planner and schedule options
- style.css: responsive appearance
- planning.js: weekly recurrence and scheduling logic
- app.js: interactions and local storage

No dependencies or build step.

## Import a schedule photo
In the course-schedule setup step, or above the weekly planner, select Import schedule photo. Choose a PNG, JPG, WebP or BMP image under 12 MB. Use a clear, upright screenshot or cropped photo in English. Convert PDF and HEIC files to screenshots first.

Choose the first week of the schedule and press Read my schedule. Automatic mode tries weekday-column tables, then day/time lists. You can choose table or list mode explicitly. Internet is required to download the text reader and English model. The image is read on your device, not uploaded, and is not saved in browser storage or exports. The reader code and model download from jsDelivr; normal network requests to that provider occur.

Review course names, weekdays, lecture/lab categories, and start/end times. Check AM/PM carefully. Correct incomplete fields and uncheck text that is not a course. Add a missing course if necessary, then choose Add selected courses. Courses repeat every week from the chosen first week. Matching existing courses are skipped rather than duplicated.

The reader supports English list schedules, tables with explicit time ranges, and colored course-block timetables with weekday headings and a left-hand time axis. For colored grids it reads course names, aligns hour labels to horizontal grid lines, and converts colored block boundaries to start/end times rounded to five minutes. This also supports Sunday-first timetables. Confirm every time, especially if a screenshot is cropped or distorted. Unclear photos, merged table cells, Arabic-only text, rotated images, or grids without distinct colored blocks may need manual corrections. It does not guarantee that every course will be found. If a time axis cannot be calibrated, missing times are left blank instead of inventing durations. Course type is taken from the title when it explicitly says lab; otherwise confirm lecture/lab in the review dropdown. Overnight time ranges are not supported.

You can expand Check or correct the recognized text and use one course per line, for example:
Monday Calculus 09:00–10:30
Wednesday Physics Lab 13:00–15:00

Correct the text and press Find courses from this text to re-create review entries. This fallback works without the photo reader or internet. Closing import discards the image preview and recognized text; only course entries you accepted are saved.

Photo recognition uses [Tesseract.js 6.0.1](https://github.com/naptha/tesseract.js/tree/v6.0.1), an open-source browser OCR engine. The remaining additional files are schedule-parser.js (timetable extraction) and photo-import.js (upload, reading, review and import).

The additional schedule-grid.js file detects colored cells and calibrates the left time axis. Extract the complete ZIP into a fresh folder when upgrading so this new file and the updated Open KU Study Planner.html stay together.



## Reset study plan
Reset study plan asks Are you sure? before deleting all study sessions across every week, including manual, suggested and recurring study sessions. Cancel keeps everything. Confirming keeps assignments, lectures, labs, personal activities, weekly study target and focus-duration preference. You can then choose a new suggested schedule or plan manually. Clear local data is a separate full reset of the app.

## Logo
khalifa-university-logo.png is the original primary logo from the university’s [official logo package](https://www.ku.ac.ae/wp-content/uploads/2019/11/KU_Logo-1-1.zip), linked on its [visual identity page](https://www.ku.ac.ae/media/visual-identity-and-branding-guidelines). Keep the assets folder with the other app files. The image is shown unchanged, preserving its proportions, on a white background in the top-left header.


## Days off and balanced suggestions
In the study-goal step, choose Yes for days off and tick the days that should stay free from suggested study. Choose No to allow every day. If all seven days are off, suggestions are empty and show the unmet goal. This preference applies to new suggestions; existing sessions remain and manual planning is still available on any day. Use Review my setup to change days off. Reset study plan preserves this preference.

Suggestions prioritize earlier assignment deadlines, then spread sessions across available days using each day's existing study and lecture/lab load. They start on quarter hours, stay within morning/afternoon/evening windows, respect the focus limit, and avoid unusably short five-minute fragments (minimum 15 minutes, or 10 for a 10-minute focus preference). Lunch 12:00–13:00 and dinner 18:00–19:00 are kept free with transition buffers. These default meal windows apply to suggestions only.

Suggested study is capped at 3 focused hours per day including study already scheduled, reduced to 2 hours on days with at least 6 hours of lectures/labs. If a goal or preparation requirement cannot fit, the app says so rather than overloading days or using a day off. Study that is already manually scheduled is not changed. These practical defaults are planning heuristics, not a claim that a particular routine is best for every student.

## Scrolling banner
The banner stays at the top, shrinks while scrolling down, and expands only when you return to the top of the page. Its slower 0.65-second animation fades and collapses details smoothly without switching layout modes. Fractional trackpad movements are supported, and reduced-motion preferences disable animation. The compact banner uses a short single row, with a smaller logo on the left and the app name to its right. banner.js handles this behavior. Keep it with the other app files.






## Academic calendar 2026–2027
The built-in dates come from the calendar PDF supplied for this update, included as academic-calendar-2026-2027.pdf. Fall teaching: 24 August–8 December 2026; exams: 9–17 December. Spring teaching: 11 January–5 May 2027; exams: 6–14 May. Summer teaching: 31 May–2 July 2027; exams: 5–7 July. The expected Fall 2027 start is displayed only as a notice; the full 2027–2028 teaching dates are not assumed.

Holiday/break periods: National Day 2–3 December 2026; winter break 21 December–3 January; provisional Eid Al Fitr 9–11 March 2027; spring break 5–9 April; provisional Eid Al Adha 17–19 May. Dates are subject to official changes and Islamic holidays depend on moon sighting. This is a saved calendar, not a live university feed.

The small calendar strip shows teaching/exam status. Calendar labels appear on relevant days. In Calendar settings & dates you can allow study suggestions on university holidays; lectures/labs still pause. Manual tasks and study entries are never silently moved or deleted. The app leaves revision available during final exams and does not invent individual exam times.

## Visual and usability refinements
The four-step setup remains unchanged. The weekly summary includes a planned-hours progress bar, saved-plan messages disappear after a few seconds, and empty days explain what to add. Manual time conflicts trigger a gentle warning, but intentional overlaps can still be saved. On phones, swipe horizontally between full-width day cards; buttons are sized for touch. The slim logo/name banner stays compact while scrolling and expands only at the top. Reduced-motion preferences remain supported.

New files: academic-calendar.js stores calendar dates; feedback.js manages short status messages. The calendar PDF and official logo are kept in assets.

## Personalized suggestions
Expand Personalize study suggestions below the study buttons. Choose your preferred time of day, maximum consecutive sessions, short break, longer break and daily study limit. Generate my personalized plan previews one tailored option; Use this schedule saves it. Preferences are saved on this device and included in exports. Standard three-option suggestions remain available.

A group includes short breaks between sessions, followed by at least the longer-break duration before another group. The chosen consecutive count is a maximum, not a requirement. Session starts remain on quarter hours, so some breaks may be longer than requested. Focus duration, days off, holidays, classes, personal activities, meals, deadlines and the weekly goal continue to apply. Heavy class days are capped at 2 hours even when you select 3 hours. Existing study entries count toward daily and weekly limits and are never moved automatically. Reset study plan keeps your preferences; Clear local data resets them. If every requirement cannot fit, remaining hours are shown.

## Improved schedule-photo reading (v15)
Smaller English timetables are enlarged before reading. Colored weekly grids receive a separate time-axis pass and individual course-block reading, including wrapped titles. The original-color image is also tried for list and explicit-time tables when cleanup loses faint text. Select Image orientation for sideways or upside-down images. Photos still need review: blurred, handwritten, Arabic-only, irregular and borderless timetables may need manual corrections. No reader can guarantee every schedule format. If exact times cannot be detected, complete them in the review rows; the app does not invent durations. Each differently colored block is a separate entry, and lecture/lab must be confirmed manually if not written in the title. JPEG geometry can shift time estimates by several minutes; verify every start and end time before saving.

## General KU timetable detection (v16)
The importer detects grid boundaries and individual weekday columns, reads the hour axis, and separates colored meeting blocks by their position. It does not match your image against saved schedules or a fixed course-name list, and it does not train a model on uploads. Five-day and seven-day layouts, uneven mobile columns, Sunday-first/Monday-first weeks, wrapped titles, changing block colors, and resized images use the same layout rules. List and explicit-time table readers remain available.

Full block-height reading handles titles wrapped over many lines. Small original-block previews appear during review. Low-confidence or clipped names are flagged, and uncertain fragments are filtered where possible. Text outside the visible screenshot cannot be reconstructed reliably; a wider/landscape desktop capture or schedule-details text is preferable when a phone display truncates names. Unknown course names are read as text, not guessed from a catalog. Colors do not determine lecture/lab.

Estimated start times and block durations use the detected hour scale and are rounded to five minutes. Verify them before adding, especially on compressed photos. Missing hour labels, perspective distortion, non-English text, grayscale layouts, or very blurry images can still require manual review. Testing covered the three supplied KU layouts, nine resized/compressed variants for block geometry, arbitrary unseen course names in parser checks, and live browser imports.


## KU Campus Passport

Open **KU Campus Passport** from the gold button near the top of the planner. On first use, enter the name that should appear on the certificate. Each passport cycle contains eight randomly selected KU-inspired student-life activities. Spin for a challenge or open the full stamp list. Completing all eight challenges creates a passport-style certificate, adds one KU Life streak, then automatically resets the stamps and prepares a fresh set of eight activities. Passport data is stored in the same browser using local storage.
