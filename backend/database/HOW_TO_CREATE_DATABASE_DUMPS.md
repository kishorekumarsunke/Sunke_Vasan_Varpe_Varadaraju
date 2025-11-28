# How to Create Proper Database Dumps from pgAdmin4

## Method 1: Custom Format Dump (Recommended for pgAdmin4 Restore)

### Steps

1. **Right-click on your `TutorTogether` database** in pgAdmin4
2. **Select "Backup..."**
3. **Configure Backup Settings:**
   - **Filename:** Choose location and name (e.g., `TutorTogether_backup.backup`)
   - **Format:** Select **"Custom"** (this is key!)
   - **Compression:** Choose level 1-9 (optional, 6 is good default)
   - **Encoding:** UTF8
4. **Data/Objects Tab:**
   - ✅ **Pre-data** (schema, tables, indexes)
   - ✅ **Data** (actual table data) ← **YES, include this for data!**
   - ✅ **Post-data** (constraints, triggers)
5. **Objects Tab:**
   - ✅ **Tables**
   - ✅ **Indexes**
   - ✅ **Constraints**
   - ✅ **Extensions** (important for uuid-ossp, citext)
6. **Click "Backup"**

### Result

- Creates a `.backup` file that works perfectly with pgAdmin4's Restore function
- Binary format is more reliable than plain SQL
- **Includes ALL data from your tables** + structure + extensions

## Method 2: Plain SQL Dump (For Manual Execution)

### Steps

1. **Right-click on your `TutorTogether` database**
2. **Select "Backup..."**
3. **Configure Settings:**
   - **Filename:** `TutorTogether_dump.sql`
   - **Format:** Select **"Plain"**
   - **Encoding:** UTF8
4. **Options Tab:**
   - ✅ **Include CREATE DATABASE statement**
   - ✅ **Include DROP DATABASE statement** (optional)
   - ✅ **Use INSERT commands** (instead of COPY)
5. **Objects Tab:** Same as Method 1
6. **Click "Backup"**

### Result

- Creates readable SQL file **with all your data as INSERT statements**
- Use with Query Tool (not Restore function)
- Good for version control and manual inspection
- **Perfect for sharing database with data to teammates**

## Method 3: Data-Only Dumps

### From pgAdmin4

1. **Right-click database → "Backup..."**
2. **Data/Objects Tab:**
   - ❌ **Pre-data** (skip schema)
   - ✅ **Data** (only table data)
   - ❌ **Post-data** (skip constraints)
3. **Result:** Backup contains only your data, no table structure

### Schema-Only Dumps

1. **Right-click database → "Backup..."**
2. **Data/Objects Tab:**
   - ✅ **Pre-data** (schema, tables, indexes)
   - ❌ **Data** (skip table data)
   - ✅ **Post-data** (constraints, triggers)
3. **Result:** Backup contains only structure, no data

## Method 4: Command Line (Most Reliable)

### Full Dump with Data

```cmd
pg_dump -U postgres -h localhost -F c -b -v -f "TutorTogether_with_data.backup" TutorTogether
```

### Data-Only Dump

```cmd
pg_dump -U postgres -h localhost -F c --data-only -f "TutorTogether_data_only.backup" TutorTogether
```

### Schema-Only Dump

```cmd
pg_dump -U postgres -h localhost -F c --schema-only -f "TutorTogether_schema_only.backup" TutorTogether
```

### Plain SQL with Data

```cmd
pg_dump -U postgres -h localhost -f "TutorTogether_with_data.sql" --clean --create --if-exists TutorTogether
```

## Restore Methods by Dump Type

### Custom Format (.backup)

- ✅ **pgAdmin4 Restore function** (Right-click database → Restore)
- ✅ **Command line:** `pg_restore -U postgres -d TutorTogether TutorTogether_custom.backup`

### Plain SQL (.sql)

- ✅ **pgAdmin4 Query Tool** (Open file and execute)
- ✅ **Command line:** `psql -U postgres -f TutorTogether_plain.sql`
- ❌ **pgAdmin4 Restore function** (causes issues like you experienced)

## Best Practices for Future Dumps

### For Sharing/Backup

1. **Use Custom format** (`-F c` or "Custom" in pgAdmin4)
2. **Include extensions** in the dump
3. **Test restore** on a different database name first

### For Version Control

1. **Use Plain format** for schema-only dumps
2. **Add to git** for tracking schema changes
3. **Use separate data dumps** for actual data

### Automated Backup Script

```batch
@echo off
REM Create timestamped backup
set TIMESTAMP=%date:~-4,4%%date:~-10,2%%date:~-7,2%_%time:~0,2%%time:~3,2%%time:~6,2%
set TIMESTAMP=%TIMESTAMP: =0%

pg_dump -U postgres -F c -b -v -f "TutorTogether_backup_%TIMESTAMP%.backup" TutorTogether

echo Backup created: TutorTogether_backup_%TIMESTAMP%.backup
pause
```

## Key Points to Remember

1. **Custom format** = Use pgAdmin4 Restore function
2. **Plain SQL format** = Use pgAdmin4 Query Tool
3. **Always include extensions** in your dumps
4. **Test your dumps** by restoring to a test database
5. **Use descriptive filenames** with dates/versions

The reason your original dump only created the migrations table was because it was a plain SQL dump being used with the Restore function, which expects custom format dumps.
